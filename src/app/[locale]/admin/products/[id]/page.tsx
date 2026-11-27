import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import ProductEditor, { type ProductValues } from "@/components/admin/ProductEditor";
import { getStaffContext } from "@/lib/admin";
import { UUID_RE } from "@/lib/format";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!UUID_RE.test(id)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });

  const [{ data: p }, { data: courses }] = await Promise.all([
    ctx.supabase.from("products").select("*").eq("id", id).maybeSingle(),
    ctx.supabase.from("courses").select("id, title_ar, title_en").order("created_at", { ascending: false }),
  ]);
  if (!p) notFound();

  const initial: ProductValues = {
    id: p.id,
    slug: p.slug,
    kind: p.kind,
    title_ar: p.title_ar,
    title_en: p.title_en,
    description_ar: p.description_ar,
    description_en: p.description_en,
    price: p.price_cents / 100,
    image_url: p.image_url ?? "",
    is_digital: p.is_digital,
    stock: p.stock === null ? "" : String(p.stock),
    course_id: p.course_id ?? "",
    file_path: p.file_path ?? "",
    published: p.published,
  };

  const t = await getTranslations("adminP6.products");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-900">{t("edit")}</h2>
      <ProductEditor initial={initial} courses={(courses ?? []).map((c) => ({ id: c.id, title: pick(c, "title", locale) }))} />
    </div>
  );
}
