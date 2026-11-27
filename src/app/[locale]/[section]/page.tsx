import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SECTION_ICONS, SECTION_KEYS, isSectionKey } from "@/components/sections";

const EXTRA_SLUGS = ["contact"] as const;

export function generateStaticParams() {
  const slugs = [...SECTION_KEYS, ...EXTRA_SLUGS];
  return routing.locales.flatMap((locale) =>
    slugs.map((section) => ({ locale, section })),
  );
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const isSection = isSectionKey(section);
  const isExtra = (EXTRA_SLUGS as readonly string[]).includes(section);
  if (!isSection && !isExtra) notFound();

  setRequestLocale(locale);
  const sections = await getTranslations("sections.items");
  const nav = await getTranslations("nav");
  const soon = await getTranslations("comingSoon");

  const title = isSection
    ? sections(`${section}.title`)
    : nav(section as (typeof EXTRA_SLUGS)[number]);
  const desc = isSection ? sections(`${section}.desc`) : null;
  const icon = isSection ? SECTION_ICONS[section] : "🦅";

  return (
    <section className="hero-bg text-white">
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-4xl ring-1 ring-white/20">
          {icon}
        </div>
        <span className="mb-4 rounded-full border border-gold-500/50 bg-gold-500/10 px-4 py-1 text-xs font-semibold text-gold-400">
          {soon("badge")}
        </span>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {desc && <p className="mt-4 max-w-xl text-white/80">{desc}</p>}
        <p className="mt-4 max-w-xl text-sm text-white/60">{soon("text")}</p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
        >
          {soon("back")}
        </Link>
      </div>
    </section>
  );
}
