import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "./supabase-server";

const TIMEOUT_MS = 7000;

export async function withTimeout<T>(promise: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("La connexion au service a dépassé le délai prévu.")), ms)
    ),
  ]);
}

export type WorkspaceContext = {
  user: { id: string; email?: string };
  tenant: any | null;
  membership: any | null;
  error?: string;
};

export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await withTimeout(supabase.auth.getUser());

  if (authError) {
    return {
      user: { id: "", email: undefined },
      tenant: null,
      membership: null,
      error: authError.message,
    };
  }

  if (!user) return null;

  try {
    const { data: membership, error: membershipError } = await withTimeout(
      supabase
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
    );
    if (membershipError) throw membershipError;

    if (!membership) {
      return { user: { id: user.id, email: user.email }, tenant: null, membership: null };
    }

    const { data: tenant, error: tenantError } = await withTimeout(
      supabase
        .from("tenants")
        .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id")
        .eq("id", membership.tenant_id)
        .single()
    );
    if (tenantError) throw tenantError;

    return { user: { id: user.id, email: user.email }, tenant, membership };
  } catch (error) {
    return {
      user: { id: user.id, email: user.email },
      tenant: null,
      membership: null,
      error: error instanceof Error ? error.message : "Erreur de connexion.",
    };
  }
});

export async function requireWorkspace() {
  const context = await getWorkspaceContext();
  if (!context) redirect("/login");
  return context;
}
