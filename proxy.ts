import { NextResponse } from "next/server";
import { createServerClient } from "./lib/supabase-server";
import { withTimeout } from "./lib/workspace";

export async function proxy() {
  try {
    const supabase = await createServerClient();
    await withTimeout(supabase.auth.getUser(), 5000);
  } catch {
    // Keep the proxy non-blocking; protected pages perform the authoritative check.
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
