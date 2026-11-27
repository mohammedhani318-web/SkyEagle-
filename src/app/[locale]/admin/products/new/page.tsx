import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import NewProductEditor from "@/components/admin/NewProductEditor";
import { getStaffContext } from "@/lib/admin";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

export default async function NewProduct({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });

  const { data: courses } = await ctx.supabase.from("courses").select("id, title_ar, title_en").order("created_at", { ascending: false });
  const t = await getTranslations("adminP6.products");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-900">{t("new")}</h2>
      <NewProductEditor courses={(courses ?? []).map((c) => ({ id: c.id, title: pick(c, "title", locale) }))} />
    </div>
  );
}
