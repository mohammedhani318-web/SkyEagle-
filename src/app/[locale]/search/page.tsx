import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import ArticleCard from "@/components/ArticleCard";
import { searchArticles } from "@/lib/content";
import { localize } from "@/lib/types";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").slice(0, 100).trim();

  const t = await getTranslations("search");
  const results = q ? (await searchArticles(q)).map((a) => localize(a, locale)) : [];

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h1 className="mb-6 text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
          <form
            role="search"
            action={`/${locale}/search`}
            method="get"
            className="flex items-center gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/20 focus-within:ring-gold-400"
          >
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-white placeholder:text-white/50 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400"
            >
              {t("button")}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {!q ? (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">
            {t("prompt")}
          </p>
        ) : (
          <>
            <p className="mb-6 text-navy-700">
              {t("resultsFor")} <strong className="text-navy-900">“{q}”</strong> ·{" "}
              {t("count", { count: results.length })}
            </p>
            {results.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">
                {t("none")}
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
