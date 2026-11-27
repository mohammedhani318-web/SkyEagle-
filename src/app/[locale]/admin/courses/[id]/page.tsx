import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import CourseEditor, {
  type CourseValues,
  type LessonRow,
  type QuestionRow,
} from "@/components/admin/CourseEditor";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCourse({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!UUID_RE.test(id)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });
  const { supabase } = ctx;

  const { data: c } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();

  const [{ data: ls }, { data: qs }] = await Promise.all([
    supabase.from("lessons").select("*").eq("course_id", id).order("position"),
    supabase.from("quiz_questions").select("*").eq("course_id", id).order("position").order("id"),
  ]);
  const lessonIds = (ls ?? []).map((l) => l.id as string);
  const questionIds = (qs ?? []).map((q) => q.id as string);
  const [{ data: contents }, { data: keys }] = await Promise.all([
    lessonIds.length
      ? supabase.from("lesson_content").select("*").in("lesson_id", lessonIds)
      : Promise.resolve({ data: [] }),
    questionIds.length
      ? supabase.from("quiz_keys").select("*").in("question_id", questionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const contentById = new Map((contents ?? []).map((x) => [x.lesson_id as string, x]));
  const keyById = new Map((keys ?? []).map((k) => [k.question_id as string, k.correct_index as number]));

  const course: CourseValues = {
    id: c.id,
    slug: c.slug,
    title_ar: c.title_ar,
    title_en: c.title_en,
    description_ar: c.description_ar,
    description_en: c.description_en,
    level: c.level,
    access: c.access,
    price: c.price_cents / 100,
    pass_percent: c.pass_percent,
    published: c.published,
  };

  const lessons: LessonRow[] = (ls ?? []).map((l) => {
    const ct = contentById.get(l.id);
    return {
      id: l.id,
      title_ar: l.title_ar,
      title_en: l.title_en,
      is_preview: l.is_preview,
      body_ar: ct?.body_ar ?? "",
      body_en: ct?.body_en ?? "",
      video_url: ct?.video_url ?? "",
    };
  });

  const questions: QuestionRow[] = (qs ?? []).map((q) => {
    const opts = (q.options as { ar: string; en: string }[]).slice(0, 4);
    const blank = { ar: "", en: "" };
    const slots = [...opts, blank, blank, blank, blank].slice(0, 4).map((o) => ({ ...o }));
    return {
      id: q.id,
      question_ar: q.question_ar,
      question_en: q.question_en,
      options: slots,
      correct: keyById.get(q.id) ?? 0,
    };
  });

  const t = await getTranslations("adminP5.courses");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-900">{t("edit")}</h2>
      <CourseEditor
        course={course}
        lessons={lessons}
        questions={questions}
        existingLessonIds={lessons.map((l) => l.id)}
      />
    </div>
  );
}
