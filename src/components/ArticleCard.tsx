import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { LocalizedArticle } from "@/lib/types";

export default function ArticleCard({ article }: { article: LocalizedArticle }) {
  const t = useTranslations("articles");

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-navy-900 px-3 py-1 text-white">
          {t(`categories.${article.category}`)}
        </span>
        <span className="rounded-full bg-sky-accent/15 px-3 py-1 text-navy-700">
          {t(`kinds.${article.kind}`)}
        </span>
        <span
          className={`rounded-full px-3 py-1 ${
            article.access === "free"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gold-500/20 text-gold-600"
          }`}
        >
          {t(article.access)}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-navy-900">{article.title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-navy-700">
        {article.excerpt}
      </p>
      <div className="flex items-center justify-between text-xs text-navy-700/80">
        <span>
          {article.readMinutes} {t("minutes")}
        </span>
        <span className="font-bold text-gold-600 group-hover:text-gold-500">
          {t("readMore")} <span className="inline-block rtl:rotate-180">→</span>
        </span>
      </div>
    </Link>
  );
}
