import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import ArticleRowActions from "@/components/admin/ArticleRowActions";
import { getStaffContext } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProducts({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });

  const { data } = await ctx.supabase
    .from("products")
    .select("id, slug, kind, title_ar, title_en, price_cents, stock, published")
    .order("created_at", { ascending: false });
  const rows = data ?? [];

  const t = await getTranslations("adminP6.products");
  const a = await getTranslations("admin.articles");
  const kinds = await getTranslations("store.kindOne");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-900">{t("colTitle")}</h2>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400"
        >
          + {t("new")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy-900/20 bg-slate-50 p-8 text-navy-700">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-900/10 bg-white shadow-sm">
          <table className="w-full min-w-[36rem] text-sm">
            <tbody className="divide-y divide-navy-900/10">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-900">{locale === "ar" ? r.title_ar : r.title_en}</div>
                    <div dir="ltr" className="text-start text-xs text-navy-700/70">
                      {r.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">{kinds(r.kind as "book" | "file" | "merch" | "course")}</td>
                  <td className="px-4 py-3">
                    {formatPrice(r.price_cents)}
                    {r.stock !== null && <span className="ms-2 text-xs text-navy-700/70">({r.stock})</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        r.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {r.published ? a("published") : a("draft")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ArticleRowActions
                      id={r.id}
                      published={r.published}
                      canDelete={ctx.role === "admin"}
                      table="products"
                      editBase="/admin/products"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
