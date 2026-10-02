import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { ensureWorkspace } from "../../../lib/workspace-provision";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/auth/error", request.url));

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed", error);
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    try {
      await ensureWorkspace(supabase, data.user);
    } catch (workspaceError) {
      console.error("[auth/callback] workspace provisioning failed", workspaceError);
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
