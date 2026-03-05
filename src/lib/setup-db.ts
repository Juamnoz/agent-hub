import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

// Singleton para evitar múltiples clientes en dev (hot reload)
const globalForSupabase = globalThis as unknown as {
  setupSupabase: ReturnType<typeof createClient> | undefined;
};

export const supabase =
  globalForSupabase.setupSupabase ??
  createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.setupSupabase = supabase;
}
