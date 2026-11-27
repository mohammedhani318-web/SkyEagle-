import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import LessonBody from "@/components/learn/LessonBody";
import LessonDoneButton from "@/components/learn/LessonDoneButton";
import QuizForm, { type QuizQuestion } from "@/components/learn/QuizForm";
import CertificateButton from "@/components/learn/CertificateButton";
import { getServerClient } from "@/lib/supabase/server";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { locale, slug } = await params;
  const { lesson: lessonParam } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await getServerClient();
  if (!supabase) notFound();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return redirect({ href: "/login", locale });

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!course) notFound();

  const { data: enr } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!enr) return redirect({ href: `/courses/${slug}`, locale });

  const [{ data: lessons }, { data: prog }, { data: qs }, { data: attempts }, { data: cert }] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, position, title_ar, title_en")
        .eq("course_id", course.id)
        .order("position"),
      supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id),
      supabase
        .from("quiz_questions")
        .select("id, position, question_ar, question_en, options")
        .eq("course_id", course.id)
        .order("position")
        .order("id"),
      supabase
        .from("quiz_attempts")
        .select("score, total, passed")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .order("score", { ascending: false }),
      supabase
        .from("certificates")
        .select("code")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .maybeSingle(),
    ]);

  const list = lessons ?? [];
  const done = new Set((prog ?? []).map((p) => p.lesson_id));
  const firstOpen = list.find((l) => !done.has(l.id)) ?? list[0];
  const selectedId =
    lessonParam && UUID_RE.test(lessonParam) && list.some((l) => l.id === lessonParam)
      ? lessonParam
      : firstOpen?.id;
  const selected = list.find((l) => l.id === selectedId);

  const { data: content } = selected
    ? await supabase
        .from("lesson_content")
        .select("body_ar, body_en, video_url")
        .eq("lesson_id", selected.id)
        .maybeSingle()
    : { data: null };

  const t = await getTranslations("courses");
  const l = await getTranslations("courses.learn");

  const questions: QuizQuestion[] = (qs ?? []).map((q) => ({
    id: q.id,
    text: pick(q, "question", locale),
    options: (q.options as { ar: string; en: string }[]).map((o) => (locale === "en" ? o.en : o.ar)),
  }));
  const bestAttempt = attempts?.[0];
  const allDone = list.length > 0 && list.every((x) => done.has(x.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href={`/courses/${slug}`} className="mb-4 inline-block text-sm font-semibold text-gold-600 hover:text-gold-500">
        <span className="inline-block rtl:rotate-180">←</span> {pick(course, "title", locale)}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 text-sm font-semibold text-navy-700">
            {t("progress", { done: list.filter((x) => done.has(x.id)).length, total: list.length })}
          </div>
          <ol className="space-y-1.5">
            {list.map((x, i) => (
              <li key={x.id}>
                <Link
                  href={{ pathname: `/courses/${slug}/learn`, query: { lesson: x.id } }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    x.id === selectedId ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-navy-900/5"
                  }`}
                >
                  <span className="w-5 text-center">{done.has(x.id) ? "✓" : i + 1}</span>
                  <span className="flex-1">{pick(x, "title", locale)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>

        <div className="min-w-0 space-y-10">
          {!selected ? (
            <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">{l("noLessons")}</p>
          ) : (
            <article className="space-y-6">
              <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
                {pick(selected, "title", locale)}
              </h1>
              {content ? (
                <LessonBody body={pick(content, "body", locale)} videoUrl={content.video_url} />
              ) : (
                <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-6">
                  <h2 className="font-bold text-navy-900">{l("lockedTitle")}</h2>
                  <p className="text-navy-700">{l("lockedText")}</p>
                </div>
              )}
              <LessonDoneButton lessonId={selected.id} userId={user.id} done={done.has(selected.id)} />
            </article>
          )}

          {questions.length > 0 && (
            <section className="space-y-4 border-t border-navy-900/10 pt-8">
              <h2 className="text-2xl font-extrabold text-navy-900">{l("quizTitle")}</h2>
              <p className="text-sm text-navy-700">{l("quizIntro", { percent: course.pass_percent })}</p>
              {bestAttempt && (
                <p className="text-sm font-semibold text-navy-700">
                  {l("bestAttempt", { score: bestAttempt.score, total: bestAttempt.total })}
                </p>
              )}
              <QuizForm courseId={course.id} questions={questions} />
            </section>
          )}

          <section className="space-y-3 rounded-2xl border border-navy-900/10 bg-slate-50 p-6">
            <h2 className="text-xl font-extrabold text-navy-900">🏅 {l("certificateTitle")}</h2>
            <p className="text-sm text-navy-700">{l("certificateHint")}</p>
            {cert ? (
              <Link
                href={`/certificates/${cert.code}`}
                className="inline-block rounded-full bg-gold-500 px-6 py-2.5 font-bold text-navy-950 hover:bg-gold-400"
              >
                {l("viewCertificate")}
              </Link>
            ) : (
              allDone && <CertificateButton courseId={course.id} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
