import { getServerClient } from "@/lib/supabase/server";

export type Role = "user" | "editor" | "admin";

/**
 * يعيد عميل الخادم + المستخدم + دوره إذا كان من الطاقم (admin أو editor)، وإلا null.
 * هذا للتجربة فقط؛ الحماية الفعلية هي سياسات RLS في قاعدة البيانات.
 */
export async function getStaffContext() {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as Role | undefined;
  if (role !== "admin" && role !== "editor") return null;

  return { supabase, user, role };
}
