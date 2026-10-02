import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    supabaseAdmin: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    facecompare: Boolean(process.env.FACECOMPARE_API_URL),
  };

  return NextResponse.json({
    status: checks.supabase ? "ok" : "configuration_required",
    checks,
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
