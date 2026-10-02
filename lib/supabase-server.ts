import { createServerClient as c } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase-config";

export async function createServerClient() {
  const jar = await cookies();
  return c(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(v) {
        try {
          v.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {}
      },
    },
  });
}
