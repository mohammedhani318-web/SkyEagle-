import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * يعيد عميل Supabase إذا كانت متغيرات البيئة مضبوطة، وإلا null
 * (وعندها يعمل الموقع بالمحتوى التجريبي المحلي).
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
