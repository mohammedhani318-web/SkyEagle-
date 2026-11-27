import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";

const CATEGORIES = ["aviation", "space", "maintenance"] as const;

export default async function AdminOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });
  const { supabase, role } = ctx;

  async function count(
    table: string,
    column?: string,
    value?: string | boolean,
  ): Promise<number> {
    const base = supabase.from(table).select("*", { count: "exact", head: true });
    const { count: c } =
      column !== undefined && value !== undefined
        ? await base.eq(column, value)
        : await base;
    return c ?? 0;
  }

  const [total, published, paid, users, favorites, ...byCat] = await Promise.all([
    count("articles"),
    count("articles", "published", true),
    count("articles", "access", "paid"),
    role === "admin" ? count("profiles") : Promise.resolve(null),
    role === "admin" ? count("favorites") : Promise.resolve(null),
    ...CATEGORIES.map((c) => count("articles", "category", c)),
  ]);

  const t = await getTranslations("admin.stats");
  const cat = await getTranslations("articles.categories");

  const cards: { label: string; value: number | null }[] = [
    { label: t("articles"), value: total },
    { label: t("published"), value: published },
    { label: t("drafts"), value: total - published },
    { label: t("paid"), value: paid },
    { label: t("users"), value: users },
    { label: t("favorites"), value: favorites },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards
          .filter((c) => c.value !== null)
          .map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm"
            >
              <div className="text-3xl font-extrabold text-navy-900">{c.value}</div>
              <div className="mt-1 text-sm text-navy-700">{c.label}</div>
            </div>
          ))}
      </div>

      <div className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-navy-900">{t("byCategory")}</h2>
        <ul className="space-y-3">
          {CATEGORIES.map((c, i) => {
            const n = byCat[i] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return (
              <li key={c}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{cat(c)}</span>
                  <span className="font-semibold">{n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-navy-900/10">
                  <div
                    className="h-full rounded-full bg-gold-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
