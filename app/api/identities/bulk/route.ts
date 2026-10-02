import { NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase-server";
import { getApiContext } from "../../../../lib/api-auth";
import { writeAudit } from "../../../../lib/audit";

type ImportRow = {
  external_id?: string;
  matricule?: string;
  display_name?: string;
  nom_complet?: string;
  department?: string;
  departement?: string;
  role?: string;
  fonction?: string;
  phone?: string;
  telephone?: string;
  email?: string;
  site?: string;
  status?: string;
  consent_recorded?: boolean | string | number;
  photo?: string;
  photo_filename?: string;
  [key: string]: unknown;
};

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  const v = text(value).toLowerCase();
  return ["true", "1", "yes", "y", "oui", "o", "vrai"].includes(v);
}

export async function POST(req: Request) {
  const auth = await getApiContext();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? (body.rows as ImportRow[]) : [];
    const mode = body?.mode === "skip" ? "skip" : "update";

    if (!rows.length) {
      return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 });
    }
    if (rows.length > 1000) {
      return NextResponse.json({ error: "Import limité à 1000 employés par lot." }, { status: 400 });
    }

    const normalized = rows.map((row, index) => {
      const externalId = text(row.external_id || row.matricule);
      const displayName = text(row.display_name || row.nom_complet);
      if (!externalId) throw new Error(`Ligne ${index + 2}: matricule obligatoire.`);
      if (!displayName) throw new Error(`Ligne ${index + 2}: nom_complet obligatoire.`);
      return {
        index,
        externalId,
        displayName,
        department: text(row.department || row.departement) || null,
        role: text(row.role || row.fonction) || null,
        phone: text(row.phone || row.telephone) || null,
        email: text(row.email) || null,
        site: text(row.site) || null,
        status: ["active", "blocked", "archived"].includes(text(row.status)) ? text(row.status) : "active",
        consentRecorded: bool(row.consent_recorded),
        photo: text(row.photo || row.photo_filename) || null,
      };
    });

    const seen = new Set<string>();
    for (const row of normalized) {
      if (seen.has(row.externalId)) {
        throw new Error(`Matricule dupliqué dans le fichier: ${row.externalId}`);
      }
      seen.add(row.externalId);
    }

    const supabase = await createServerClient();
    const externalIds = normalized.map((row) => row.externalId);
    const { data: existing, error: existingError } = await supabase
      .from("identities")
      .select("id,external_id,display_name,metadata,status")
      .eq("tenant_id", auth.context.tenant!.id)
      .in("external_id", externalIds);

    if (existingError) throw existingError;

    const existingMap = new Map((existing || []).map((item: any) => [String(item.external_id), item]));
    const rowsToInsert: any[] = [];
    const resolved: any[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of normalized) {
      const current = existingMap.get(row.externalId);
      const metadata = {
        ...(current?.metadata || {}),
        department: row.department,
        role: row.role,
        phone: row.phone,
        email: row.email,
        site: row.site,
        consent_recorded: row.consentRecorded,
        consent_at: row.consentRecorded
          ? (current?.metadata?.consent_at || new Date().toISOString())
          : (current?.metadata?.consent_at || null),
        import_source: "employee_csv",
      };

      if (current && mode === "skip") {
        skipped++;
        resolved.push({
          rowIndex: row.index,
          external_id: row.externalId,
          display_name: current.display_name,
          identity_id: current.id,
          action: "skipped",
          photo: row.photo,
        });
        continue;
      }

      if (current) {
        const { data, error } = await supabase
          .from("identities")
          .update({
            display_name: row.displayName,
            status: row.status,
            metadata,
          })
          .eq("id", current.id)
          .eq("tenant_id", auth.context.tenant!.id)
          .select("id,display_name,external_id,identity_type,status,metadata,created_at")
          .single();

        if (error) throw error;
        updated++;
        resolved.push({
          rowIndex: row.index,
          external_id: row.externalId,
          display_name: data.display_name,
          identity_id: data.id,
          action: "updated",
          photo: row.photo,
          data,
        });
        continue;
      }

      rowsToInsert.push({
        tenant_id: auth.context.tenant!.id,
        display_name: row.displayName,
        external_id: row.externalId,
        identity_type: "person",
        status: row.status,
        metadata,
      });
    }

    if (rowsToInsert.length) {
      const { data, error } = await supabase
        .from("identities")
        .insert(rowsToInsert)
        .select("id,display_name,external_id,identity_type,status,metadata,created_at");

      if (error) throw error;

      const insertedMap = new Map((data || []).map((item: any) => [String(item.external_id), item]));
      for (const row of normalized) {
        if (!insertedMap.has(row.externalId)) continue;
        const item = insertedMap.get(row.externalId);
        created++;
        resolved.push({
          rowIndex: row.index,
          external_id: row.externalId,
          display_name: item.display_name,
          identity_id: item.id,
          action: "created",
          photo: row.photo,
          data: item,
        });
      }
    }

    resolved.sort((a, b) => a.rowIndex - b.rowIndex);

    await writeAudit(supabase, {
      tenantId: auth.context.tenant!.id,
      actorUserId: auth.context.user.id,
      action: "identity.bulk_import",
      resourceType: "identity",
      metadata: {
        total: rows.length,
        created,
        updated,
        skipped,
        mode,
      },
    });

    return NextResponse.json({
      ok: true,
      summary: {
        total: rows.length,
        created,
        updated,
        skipped,
      },
      rows: resolved,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import impossible." },
      { status: 400 }
    );
  }
}
