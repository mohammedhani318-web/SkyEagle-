import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { pick, paragraphs } from "@/lib/db-text";

export const dynamic = "force-dynamic";

const KINDS = ["job", "training"] as const;

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { locale } = await params;
  const { kind } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("jobs");
  const sec = await getTranslations("sections.items");
  const auth = await getTranslations("auth");
  const activeKind = KINDS.find((k) => k === kind);

  const supabase = await getServerClient();
  const today = new Date().toISOString().slice(0, 10);
  let rows: Record<string, unknown>[] = [];
  if (supabase) {
    let q = supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order("created_at", { ascending: false });
    if (activeKind) q = q.eq("kind", activeKind);
    const { data } = await q;
    rows = data ?? [];
  }

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 ring-1 ${
      active
        ? "bg-navy-900 text-white ring-navy-900"
        : "bg-white text-navy-900 ring-navy-900/20 hover:ring-gold-500"
    }`;

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-3xl ring-1 ring-white/20">
            💼
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{sec("jobs.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{sec("jobs.desc")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <nav className="mb-8 flex flex-wrap gap-2 text-sm font-semibold">
          <Link href="/jobs" className={chip(!activeKind)}>
            {t("all")}
          </Link>
          {KINDS.map((k) => (
            <Link key={k} href={{ pathname: "/jobs", query: { kind: k } }} className={chip(activeKind === k)}>
              {t(k)}
            </Link>
          ))}
        </nav>

        {!supabase ? (
          <p className="rounded-xl bg-amber-50 p-6 text-center text-amber-900">{auth("notConfigured")}</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">{t("empty")}</p>
        ) : (
          <ul className="space-y-5">
            {rows.map((j) => (
              <li
                key={String(j.id)}
                className="rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-navy-900 px-3 py-1 text-white">
                    {t(`kind.${j.kind as "job" | "training"}`)}
                  </span>
                  {typeof j.expires_at === "string" && (
                    <span className="rounded-full bg-gold-500/20 px-3 py-1 text-gold-600">
                      {t("expires")}: {j.expires_at}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-navy-900">{pick(j, "title", locale)}</h2>
                <p className="mt-1 text-sm text-navy-700">
                  {String(j.company)}
                  {j.location ? ` · ${String(j.location)}` : ""}
                </p>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-navy-800">
                  {paragraphs(pick(j, "description", locale)).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {typeof j.apply_url === "string" && j.apply_url.startsWith("https://") && (
                  <a
                    href={j.apply_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-4 inline-block rounded-full bg-gold-500 px-5 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400"
                  >
                    {t("apply")} ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
