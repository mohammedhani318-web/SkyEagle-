import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ArticleCard from "./ArticleCard";
import { SECTION_ICONS } from "./sections";
import { getAllArticles } from "@/lib/content";
import { localize, type Category, type Kind } from "@/lib/types";

type Props = {
  locale: string;
  /** القسم: تصنيف محدد أو المكتبة (كل المواد مع فلتر النوع) */
  section: Category | "library";
  kind?: string;
};

const KINDS: Kind[] = ["article", "reference", "book"];

export default async function CategoryPage({ locale, section, kind }: Props) {
  setRequestLocale(locale);
  const sec = await getTranslations("sections.items");
  const t = await getTranslations("articles");

  const all = await getAllArticles();
  const activeKind = KINDS.find((k) => k === kind);

  let items = section === "library" ? all : all.filter((a) => a.category === section);
  if (section === "library" && activeKind) {
    items = items.filter((a) => a.kind === activeKind);
  }
  const localized = items.map((a) => localize(a, locale));

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-3xl ring-1 ring-white/20">
            {SECTION_ICONS[section]}
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {sec(`${section}.title`)}
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">{sec(`${section}.desc`)}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {section === "library" && (
          <nav
            aria-label={t("filterLabel")}
            className="mb-8 flex flex-wrap gap-2 text-sm font-semibold"
          >
            <Link
              href="/library"
              className={`rounded-full px-4 py-2 ring-1 ${
                !activeKind
                  ? "bg-navy-900 text-white ring-navy-900"
                  : "bg-white text-navy-900 ring-navy-900/20 hover:ring-gold-500"
              }`}
            >
              {t("all")}
            </Link>
            {KINDS.map((k) => (
              <Link
                key={k}
                href={{ pathname: "/library", query: { kind: k } }}
                className={`rounded-full px-4 py-2 ring-1 ${
                  activeKind === k
                    ? "bg-navy-900 text-white ring-navy-900"
                    : "bg-white text-navy-900 ring-navy-900/20 hover:ring-gold-500"
                }`}
              >
                {t(`kinds.${k}`)}
              </Link>
            ))}
          </nav>
        )}

        {localized.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {localized.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
