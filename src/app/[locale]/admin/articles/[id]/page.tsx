import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import ArticleEditor, { type EditorValues } from "@/components/admin/ArticleEditor";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditArticle({
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

  const { data } = await ctx.supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const initial: EditorValues = {
    id: data.id,
    slug: data.slug,
    category: data.category,
    kind: data.kind,
    access: data.access,
    read_minutes: data.read_minutes,
    published: data.published,
    published_at: String(data.published_at).slice(0, 10),
    title_ar: data.title_ar,
    title_en: data.title_en,
    excerpt_ar: data.excerpt_ar,
    excerpt_en: data.excerpt_en,
    body_ar: data.body_ar,
    body_en: data.body_en,
  };

  const t = await getTranslations("admin.articles");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-900">{t("edit")}</h2>
      <ArticleEditor initial={initial} />
    </div>
  );
}
