import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import EnrollButton from "@/components/learn/EnrollButton";
import { getServerClient } from "@/lib/supabase/server";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await getServerClient();
  if (!supabase) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!course) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, position, title_ar, title_en, is_preview")
    .eq("course_id", course.id)
    .order("position");

  let enrolled = false;
  const done = new Set<string>();
  if (user) {
    const { data: enr } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    enrolled = !!enr;
    if (enrolled) {
      const { data: prog } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id);
      (prog ?? []).forEach((p) => done.add(p.lesson_id));
    }
  }

  // الدورة المدفوعة تُشترى من المتجر عبر منتج من نوع "دورة" مرتبط بها
  let storeSlug: string | null = null;
  if (!enrolled && course.access === "paid") {
    const { data: prod } = await supabase
      .from("products")
      .select("slug")
      .eq("course_id", course.id)
      .eq("published", true)
      .maybeSingle();
    storeSlug = prod?.slug ?? null;
  }

  const list = lessons ?? [];
  const doneCount = list.filter((l) => done.has(l.id)).length;
  const t = await getTranslations("courses");

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <Link href="/courses" className="mb-5 inline-block text-sm font-semibold text-gold-400 hover:text-gold-500">
            <span className="inline-block rtl:rotate-180">←</span> {t("back")}
          </Link>
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {t(`level.${course.level as "beginner" | "intermediate" | "advanced"}`)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {course.access === "free" ? t("free") : `${t("paid")} · $${(course.price_cents / 100).toFixed(2)}`}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {t("pass", { percent: course.pass_percent })}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{pick(course, "title", locale)}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{pick(course, "description", locale)}</p>

          <div className="mt-8">
            {enrolled ? (
              <Link
                href={`/courses/${course.slug}/learn`}
                className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
              >
                {t("continue")}
              </Link>
            ) : !user ? (
              <Link
                href="/login"
                className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
              >
                {t("loginToEnroll")}
              </Link>
            ) : course.access === "free" ? (
              <EnrollButton courseId={course.id} userId={user.id} />
            ) : storeSlug ? (
              <Link
                href={`/store/${storeSlug}`}
                className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
              >
                {t("buy")}
              </Link>
            ) : (
              <p className="max-w-md rounded-lg bg-white/10 p-4 text-sm">{t("paidNotice")}</p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-extrabold text-navy-900">{t("outline")}</h2>
          {enrolled && list.length > 0 && (
            <span className="text-sm font-semibold text-navy-700">
              {t("progress", { done: doneCount, total: list.length })}
            </span>
          )}
        </div>
        <ol className="space-y-3">
          {list.map((l, i) => (
            <li
              key={l.id}
              className="flex items-center gap-3 rounded-xl border border-navy-900/10 bg-white px-4 py-3"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  done.has(l.id) ? "bg-emerald-600 text-white" : "bg-navy-900 text-white"
                }`}
              >
                {done.has(l.id) ? "✓" : i + 1}
              </span>
              <span className="flex-1 font-semibold text-navy-900">{pick(l, "title", locale)}</span>
              {l.is_preview && (
                <span className="rounded-full bg-sky-accent/15 px-2.5 py-1 text-xs font-semibold text-navy-700">
                  {t("preview")}
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
