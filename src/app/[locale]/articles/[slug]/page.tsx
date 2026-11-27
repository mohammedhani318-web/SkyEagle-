import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import ArticleCard from "@/components/ArticleCard";
import FavoriteButton from "@/components/FavoriteButton";
import { getAllArticles, getArticle } from "@/lib/content";
import { localize } from "@/lib/types";

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return routing.locales.flatMap((locale) =>
    articles.map((a) => ({ locale, slug: a.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  const a = localize(article, locale);
  return { title: `${a.title} | SkyEagle`, description: a.excerpt };
}

export const revalidate = 60;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const found = await getArticle(slug);
  if (!found) notFound();

  const t = await getTranslations("articles");
  const article = localize(found, locale);
  const related = (await getAllArticles())
    .filter((a) => a.category === found.category && a.slug !== found.slug)
    .slice(0, 3)
    .map((a) => localize(a, locale));

  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(article.publishedAt));

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <Link
            href={`/${article.category}`}
            className="mb-5 inline-block text-sm font-semibold text-gold-400 hover:text-gold-500"
          >
            <span className="inline-block rtl:rotate-180">←</span>{" "}
            {t(`categories.${article.category}`)}
          </Link>
          <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {t(`kinds.${article.kind}`)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {t(article.access)}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-white/80">{article.excerpt}</p>
          <p className="mt-4 text-xs text-white/60">
            {t("published")}: {date} · {article.readMinutes} {t("minutes")}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <FavoriteButton slug={article.slug} />
        </div>
        {article.access === "paid" ? (
          <p className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-6 text-navy-900">
            {t("locked")}
          </p>
        ) : (
          <div className="space-y-5 text-lg leading-loose text-navy-900">
            {article.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="border-t border-navy-900/10 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-2xl font-extrabold text-navy-900">
              {t("related")}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
