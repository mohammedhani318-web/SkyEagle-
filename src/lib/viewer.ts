import { getServerClient } from "@/lib/supabase/server";

/** المستخدم الحالي ودوره (إن وُجد). يعيد supabase=null عند غياب المفاتيح. */
export async function getViewer() {
  const supabase = await getServerClient();
  if (!supabase) return { supabase: null, user: null, isStaff: false };

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { supabase, user: null, isStaff: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isStaff = profile?.role === "admin" || profile?.role === "editor";
  return { supabase, user, isStaff };
}
