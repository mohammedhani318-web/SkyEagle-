"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";
import { parseVideo } from "@/lib/db-text";

export type OptionRow = { ar: string; en: string };
export type QuestionRow = {
  id: string;
  question_ar: string;
  question_en: string;
  options: OptionRow[]; // دائمًا 4 خانات، الفارغ منها يُتجاهل
  correct: number;
};
export type LessonRow = {
  id: string;
  title_ar: string;
  title_en: string;
  is_preview: boolean;
  body_ar: string;
  body_en: string;
  video_url: string;
};
export type CourseValues = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  level: "beginner" | "intermediate" | "advanced";
  access: "free" | "paid";
  price: number;
  pass_percent: number;
  published: boolean;
};

type Props = {
  course: CourseValues;
  lessons: LessonRow[];
  questions: QuestionRow[];
  existingLessonIds: string[];
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLOTS = 4;

export function newLesson(): LessonRow {
  return {
    id: crypto.randomUUID(),
    title_ar: "",
    title_en: "",
    is_preview: false,
    body_ar: "",
    body_en: "",
    video_url: "",
  };
}

export function newQuestion(): QuestionRow {
  return {
    id: crypto.randomUUID(),
    question_ar: "",
    question_en: "",
    options: Array.from({ length: SLOTS }, () => ({ ar: "", en: "" })),
    correct: 0,
  };
}

export default function CourseEditor({ course, lessons: l0, questions: q0, existingLessonIds }: Props) {
  const t = useTranslations("adminP5.courses");
  const lv = useTranslations("courses.level");
  const acc = useTranslations("courses");
  const router = useRouter();

  const [c, setC] = useState(course);
  const [lessons, setLessons] = useState(l0);
  const [questions, setQuestions] = useState(q0);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const setCourse = <K extends keyof CourseValues>(k: K, v: CourseValues[K]) =>
    setC((p) => ({ ...p, [k]: v }));
  const setLesson = (i: number, patch: Partial<LessonRow>) =>
    setLessons((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setQuestion = (i: number, patch: Partial<QuestionRow>) =>
    setQuestions((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setOption = (qi: number, oi: number, patch: Partial<OptionRow>) =>
    setQuestions((p) =>
      p.map((q, j) =>
        j === qi ? { ...q, options: q.options.map((o, k) => (k === oi ? { ...o, ...patch } : o)) } : q,
      ),
    );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const slug = c.slug.trim();
    if (!SLUG_RE.test(slug) || slug.length > 120) return setError(t("errSlug"));
    if (!c.title_ar.trim() || !c.title_en.trim()) return setError(t("errRequired"));
    for (const l of lessons) {
      if (!l.title_ar.trim() || !l.title_en.trim()) return setError(t("errRequired"));
      if (l.video_url.trim() && !parseVideo(l.video_url.trim())) return setError(t("errVideo"));
    }

    // تنظيف الأسئلة: الخيارات الفارغة تُهمل، والمكتملة فقط تُحفظ
    const cleanQuestions: { row: QuestionRow; options: OptionRow[]; correct: number }[] = [];
    for (const q of questions) {
      const kept: { o: OptionRow; origin: number }[] = [];
      for (let i = 0; i < q.options.length; i++) {
        const o = { ar: q.options[i].ar.trim(), en: q.options[i].en.trim() };
        if (!o.ar && !o.en) continue;
        if (!o.ar || !o.en) return setError(t("errQuestion"));
        kept.push({ o, origin: i });
      }
      const correct = kept.findIndex((k) => k.origin === q.correct);
      if (!q.question_ar.trim() || !q.question_en.trim() || kept.length < 2 || correct < 0)
        return setError(t("errQuestion"));
      cleanQuestions.push({ row: q, options: kept.map((k) => k.o), correct });
    }

    const supabase = getBrowserClient();
    if (!supabase) return setError(t("errSave"));
    setBusy(true);

    try {
      const { error: cErr } = await supabase.from("courses").upsert({
        id: c.id,
        slug,
        title_ar: c.title_ar.trim(),
        title_en: c.title_en.trim(),
        description_ar: c.description_ar.trim(),
        description_en: c.description_en.trim(),
        level: c.level,
        access: c.access,
        price_cents: c.access === "paid" ? Math.max(0, Math.round(c.price * 100)) : 0,
        pass_percent: Math.min(100, Math.max(1, Math.round(c.pass_percent) || 70)),
        published: c.published,
      });
      if (cErr) {
        setError(cErr.code === "23505" ? t("errDuplicate") : t("errSave"));
        return;
      }

      // الدروس: حذف المحذوفة ثم upsert للباقي
      const keep = new Set(lessons.map((l) => l.id));
      const removed = existingLessonIds.filter((id) => !keep.has(id));
      if (removed.length) {
        const { error } = await supabase.from("lessons").delete().in("id", removed);
        if (error) throw error;
      }
      if (lessons.length) {
        const { error: lErr } = await supabase.from("lessons").upsert(
          lessons.map((l, i) => ({
            id: l.id,
            course_id: c.id,
            position: i + 1,
            title_ar: l.title_ar.trim(),
            title_en: l.title_en.trim(),
            is_preview: l.is_preview,
          })),
        );
        if (lErr) throw lErr;
        const { error: bErr } = await supabase.from("lesson_content").upsert(
          lessons.map((l) => ({
            lesson_id: l.id,
            body_ar: l.body_ar.trim(),
            body_en: l.body_en.trim(),
            video_url: l.video_url.trim() || null,
          })),
        );
        if (bErr) throw bErr;
      }

      // الأسئلة: استبدال كامل
      const { error: dErr } = await supabase.from("quiz_questions").delete().eq("course_id", c.id);
      if (dErr) throw dErr;
      if (cleanQuestions.length) {
        const { error: qErr } = await supabase.from("quiz_questions").insert(
          cleanQuestions.map((q, i) => ({
            id: q.row.id,
            course_id: c.id,
            position: i + 1,
            question_ar: q.row.question_ar.trim(),
            question_en: q.row.question_en.trim(),
            options: q.options,
          })),
        );
        if (qErr) throw qErr;
        const { error: kErr } = await supabase
          .from("quiz_keys")
          .insert(cleanQuestions.map((q) => ({ question_id: q.row.id, correct_index: q.correct })));
        if (kErr) throw kErr;
      }

      setOk(true);
      router.push("/admin/courses");
      router.refresh();
    } catch {
      setError(t("errSave"));
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";
  const label = "block text-sm font-semibold text-navy-900";
  const smallBtn =
    "rounded-md border border-navy-900/20 px-2.5 py-1 text-xs font-semibold hover:border-gold-500";

  return (
    <form onSubmit={save} className="space-y-8">
      {/* بيانات الدورة */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          {t("slug")}
          <input value={c.slug} onChange={(e) => setCourse("slug", e.target.value)} dir="ltr" required className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("titleAr")}
          <input dir="rtl" value={c.title_ar} onChange={(e) => setCourse("title_ar", e.target.value)} required className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("titleEn")}
          <input dir="ltr" value={c.title_en} onChange={(e) => setCourse("title_en", e.target.value)} required className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("descAr")}
          <textarea dir="rtl" rows={3} value={c.description_ar} onChange={(e) => setCourse("description_ar", e.target.value)} className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("descEn")}
          <textarea dir="ltr" rows={3} value={c.description_en} onChange={(e) => setCourse("description_en", e.target.value)} className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("level")}
          <select value={c.level} onChange={(e) => setCourse("level", e.target.value as CourseValues["level"])} className={`${field} mt-1`}>
            {(["beginner", "intermediate", "advanced"] as const).map((x) => (
              <option key={x} value={x}>
                {lv(x)}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t("access")}
          <select value={c.access} onChange={(e) => setCourse("access", e.target.value as CourseValues["access"])} className={`${field} mt-1`}>
            <option value="free">{acc("free")}</option>
            <option value="paid">{acc("paid")}</option>
          </select>
        </label>
        {c.access === "paid" && (
          <label className={label}>
            {t("price")}
            <input type="number" min={0} step="0.01" value={c.price} onChange={(e) => setCourse("price", Number(e.target.value))} className={`${field} mt-1`} />
          </label>
        )}
        <label className={label}>
          {t("pass")}
          <input type="number" min={1} max={100} value={c.pass_percent} onChange={(e) => setCourse("pass_percent", Number(e.target.value))} className={`${field} mt-1`} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-navy-900">
          <input type="checkbox" checked={c.published} onChange={(e) => setCourse("published", e.target.checked)} className="h-4 w-4 accent-gold-500" />
          {t("published")}
        </label>
      </div>
      {c.access === "paid" && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{t("grantNote")}</p>}

      {/* الدروس */}
      <section className="space-y-4">
        <h3 className="text-lg font-extrabold text-navy-900">{t("lessons")}</h3>
        <p className="text-xs text-navy-700/80">{t("hintLessonsDelete")}</p>
        {lessons.map((l, i) => (
          <div key={l.id} className="space-y-3 rounded-xl border border-navy-900/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy-900">#{i + 1}</span>
              <div className="flex gap-2">
                <button type="button" disabled={i === 0} className={smallBtn} onClick={() => setLessons((p) => { const n = [...p]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>↑</button>
                <button type="button" disabled={i === lessons.length - 1} className={smallBtn} onClick={() => setLessons((p) => { const n = [...p]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}>↓</button>
                <button type="button" className={`${smallBtn} text-red-700`} onClick={() => setLessons((p) => p.filter((_, j) => j !== i))}>{t("remove")}</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                {t("lessonTitleAr")}
                <input dir="rtl" value={l.title_ar} onChange={(e) => setLesson(i, { title_ar: e.target.value })} className={`${field} mt-1`} />
              </label>
              <label className={label}>
                {t("lessonTitleEn")}
                <input dir="ltr" value={l.title_en} onChange={(e) => setLesson(i, { title_en: e.target.value })} className={`${field} mt-1`} />
              </label>
              <label className={label}>
                {t("lessonBodyAr")}
                <textarea dir="rtl" rows={6} value={l.body_ar} onChange={(e) => setLesson(i, { body_ar: e.target.value })} className={`${field} mt-1`} />
              </label>
              <label className={label}>
                {t("lessonBodyEn")}
                <textarea dir="ltr" rows={6} value={l.body_en} onChange={(e) => setLesson(i, { body_en: e.target.value })} className={`${field} mt-1`} />
              </label>
              <label className={label}>
                {t("video")}
                <input dir="ltr" value={l.video_url} onChange={(e) => setLesson(i, { video_url: e.target.value })} placeholder="https://" className={`${field} mt-1`} />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-navy-900">
                <input type="checkbox" checked={l.is_preview} onChange={(e) => setLesson(i, { is_preview: e.target.checked })} className="h-4 w-4 accent-gold-500" />
                {t("preview")}
              </label>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setLessons((p) => [...p, newLesson()])} className="rounded-lg border border-navy-900/20 px-4 py-2 text-sm font-semibold hover:border-gold-500">
          {t("addLesson")}
        </button>
      </section>

      {/* الاختبار */}
      <section className="space-y-4">
        <h3 className="text-lg font-extrabold text-navy-900">{t("quiz")}</h3>
        {questions.map((q, qi) => (
          <div key={q.id} className="space-y-3 rounded-xl border border-navy-900/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy-900">#{qi + 1}</span>
              <button type="button" className={`${smallBtn} text-red-700`} onClick={() => setQuestions((p) => p.filter((_, j) => j !== qi))}>{t("remove")}</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                {t("questionAr")}
                <input dir="rtl" value={q.question_ar} onChange={(e) => setQuestion(qi, { question_ar: e.target.value })} className={`${field} mt-1`} />
              </label>
              <label className={label}>
                {t("questionEn")}
                <input dir="ltr" value={q.question_en} onChange={(e) => setQuestion(qi, { question_en: e.target.value })} className={`${field} mt-1`} />
              </label>
            </div>
            <div className="space-y-2">
              {q.options.map((o, oi) => (
                <div key={oi} className="grid items-center gap-2 sm:grid-cols-[auto_1fr_1fr]">
                  <label className="flex items-center gap-1 text-xs font-semibold text-navy-700">
                    <input type="radio" name={`correct-${q.id}`} checked={q.correct === oi} onChange={() => setQuestion(qi, { correct: oi })} className="accent-gold-500" />
                    {t("correct")}
                  </label>
                  <input dir="rtl" aria-label={t("optionAr")} placeholder={t("optionAr")} value={o.ar} onChange={(e) => setOption(qi, oi, { ar: e.target.value })} className={field} />
                  <input dir="ltr" aria-label={t("optionEn")} placeholder={t("optionEn")} value={o.en} onChange={(e) => setOption(qi, oi, { en: e.target.value })} className={field} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setQuestions((p) => [...p, newQuestion()])} className="rounded-lg border border-navy-900/20 px-4 py-2 text-sm font-semibold hover:border-gold-500">
          {t("addQuestion")}
        </button>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {t("saved")}
        </p>
      )}
      <button type="submit" disabled={busy} className="rounded-lg bg-navy-900 px-6 py-2.5 font-bold text-white hover:bg-navy-700 disabled:opacity-60">
        {t("save")}
      </button>
    </form>
  );
}
