import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SECTION_ICONS, SECTION_KEYS } from "@/components/sections";

const PLATFORM_KEYS = ["knowledge", "learning", "careers", "community", "commerce"] as const;
const PLATFORM_ICONS = ["📖", "🎓", "💼", "🤝", "🛍"];
const AUDIENCE_KEYS = ["students", "engineers", "enthusiasts", "jobseekers"] as const;

function HeroArt() {
  return (
    <svg viewBox="0 0 480 360" className="float-slow w-full max-w-lg" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <circle cx="240" cy="180" r="150" stroke="#d4a935" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 8" />
      <circle cx="240" cy="180" r="110" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1.5" />
      <rect x="30" y="170" width="190" height="3" rx="1.5" fill="url(#trail)" />
      <rect x="70" y="195" width="150" height="2" rx="1" fill="url(#trail)" opacity="0.6" />
      {/* aircraft */}
      <g transform="translate(240 180) rotate(-12)">
        <path d="M-120 0 C-60 -14 70 -14 130 0 C70 14 -60 14 -120 0 Z" fill="#ffffff" />
        <path d="M-10 -4 L-50 -80 L-28 -80 L40 -4 Z" fill="#e3bd55" />
        <path d="M-10 4 L-50 80 L-28 80 L40 4 Z" fill="#d4a935" />
        <path d="M-110 -2 L-126 -34 L-108 -34 L-84 -2 Z" fill="#38bdf8" />
        <circle cx="105" cy="0" r="3" fill="#0a1a33" />
      </g>
      <circle cx="90" cy="70" r="3" fill="#ffffff" opacity="0.7" />
      <circle cx="400" cy="90" r="2" fill="#ffffff" opacity="0.6" />
      <circle cx="420" cy="290" r="3" fill="#d4a935" opacity="0.8" />
      <circle cx="60" cy="300" r="2" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const hero = await getTranslations("hero");
  const aud = await getTranslations("audience");
  const sec = await getTranslations("sections");
  const plat = await getTranslations("platform");
  const cta = await getTranslations("cta");

  return (
    <>
      {/* Hero */}
      <section className="hero-bg text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-block rounded-full border border-gold-500/50 bg-gold-500/10 px-4 py-1 text-xs font-semibold text-gold-400">
              {hero("badge")}
            </span>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              {hero("title")}{" "}
              <span className="text-gold-400">{hero("titleAccent")}</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {hero("subtitle")}
            </p>

            <form
              role="search"
              action={`/${locale}/search`}
              method="get"
              className="flex max-w-xl items-center gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/20 focus-within:ring-gold-400"
            >
              <input
                type="search"
                name="q"
                placeholder={hero("searchPlaceholder")}
                aria-label={hero("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="rounded-full bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400"
              >
                🔍
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              <a
                href="#sections"
                className="rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-400"
              >
                {hero("ctaPrimary")}
              </a>
              <Link
                href="/signup"
                className="rounded-full border border-white/30 px-6 py-3 font-semibold transition hover:border-gold-400 hover:text-gold-400"
              >
                {hero("ctaSecondary")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="border-b border-navy-900/10 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="mb-5 text-center text-sm font-bold uppercase tracking-wider text-navy-700">
            {aud("title")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE_KEYS.map((key) => (
              <li
                key={key}
                className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-navy-900 shadow-sm ring-1 ring-navy-900/10"
              >
                {aud(`items.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sections */}
      <section id="sections" className="scroll-mt-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-extrabold text-navy-900 sm:text-4xl">
              {sec("title")}
            </h2>
            <div className="mt-3 h-1 w-16 rounded bg-gold-500" />
            <p className="mt-4 text-navy-700">{sec("subtitle")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SECTION_KEYS.map((key) => (
              <Link
                key={key}
                href={`/${key}`}
                className="group rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-2xl">
                  {SECTION_ICONS[key]}
                </span>
                <h3 className="mb-2 text-lg font-bold text-navy-900">
                  {sec(`items.${key}.title`)}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-navy-700">
                  {sec(`items.${key}.desc`)}
                </p>
                <span className="text-sm font-bold text-gold-600 group-hover:text-gold-500">
                  {sec("explore")} <span className="inline-block rtl:rotate-180">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform pillars */}
      <section className="bg-navy-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">{plat("title")}</h2>
            <div className="mt-3 h-1 w-16 rounded bg-gold-500" />
            <p className="mt-4 text-white/75">{plat("subtitle")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {PLATFORM_KEYS.map((key, i) => (
              <div
                key={key}
                className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10"
              >
                <div className="mb-3 text-3xl">{PLATFORM_ICONS[i]}</div>
                <h3 className="mb-1 font-bold text-gold-400">{plat(`items.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-white/75">
                  {plat(`items.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{cta("title")}</h2>
          <p className="mt-3 text-white/80">{cta("subtitle")}</p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-full bg-gold-500 px-8 py-3 font-bold text-navy-950 transition hover:bg-gold-400"
          >
            {cta("button")}
          </Link>
        </div>
      </section>
    </>
  );
}
