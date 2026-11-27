import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("courses");
  const sec = await getTranslations("sections.items");
  const auth = await getTranslations("auth");

  const supabase = await getServerClient();
  const { data } = supabase
    ? await supabase
        .from("courses")
        .select("id, slug, title_ar, title_en, description_ar, description_en, level, access, price_cents")
        .eq("published", true)
        .order("created_at", { ascending: false })
    : { data: null };
  const courses = data ?? [];

  const { data: lessonRows } =
    supabase && courses.length
      ? await supabase.from("lessons").select("course_id").in("course_id", courses.map((c) => c.id))
      : { data: [] };
  const lessonCount = new Map<string, number>();
  (lessonRows ?? []).forEach((l) =>
    lessonCount.set(l.course_id, (lessonCount.get(l.course_id) ?? 0) + 1),
  );

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-3xl ring-1 ring-white/20">
            🎓
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{sec("courses.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{sec("courses.desc")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {!supabase ? (
          <p className="rounded-xl bg-amber-50 p-6 text-center text-amber-900">{auth("notConfigured")}</p>
        ) : courses.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">{t("empty")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.slug}`}
                className="group flex flex-col rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg"
              >
                <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-navy-900 px-3 py-1 text-white">
                    {t(`level.${c.level as "beginner" | "intermediate" | "advanced"}`)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ${
                      c.access === "free"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gold-500/20 text-gold-600"
                    }`}
                  >
                    {c.access === "free" ? t("free") : `${t("paid")} · $${(c.price_cents / 100).toFixed(2)}`}
                  </span>
                </div>
                <h2 className="mb-2 text-lg font-bold text-navy-900">{pick(c, "title", locale)}</h2>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-navy-700">
                  {pick(c, "description", locale)}
                </p>
                <div className="flex items-center justify-between text-xs text-navy-700/80">
                  <span>{t("lessons", { count: lessonCount.get(c.id) ?? 0 })}</span>
                  <span className="font-bold text-gold-600 group-hover:text-gold-500">
                    {t("view")} <span className="inline-block rtl:rotate-180">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
