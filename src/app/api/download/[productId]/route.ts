import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";

/**
 * تنزيل منتج رقمي: يتحقق من الاستحقاق (طلب مدفوع أو طاقم) ثم يعيد رابطًا موقّعًا قصير العمر.
 * الملفات في bucket خاص، وسياسة التخزين تفرض الاستحقاق نفسه مرة ثانية.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const json = (body: object, status: number) =>
    NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

  if (!UUID_RE.test(productId)) return json({ error: "not found" }, 404);

  const supabase = await getServerClient();
  if (!supabase) return json({ error: "not configured" }, 503);

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "unauthorized" }, 401);

  const { data: product } = await supabase
    .from("products")
    .select("file_path, is_digital")
    .eq("id", productId)
    .maybeSingle();
  if (!product?.is_digital || !product.file_path) return json({ error: "not found" }, 404);

  const { data: allowed } = await supabase.rpc("can_download", { p_path: product.file_path });
  if (!allowed) return json({ error: "forbidden" }, 403);

  const { data: signed, error } = await supabase.storage
    .from("downloads")
    .createSignedUrl(product.file_path, 60, { download: true });
  if (error || !signed?.signedUrl) return json({ error: "not found" }, 404);

  const res = NextResponse.redirect(signed.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
