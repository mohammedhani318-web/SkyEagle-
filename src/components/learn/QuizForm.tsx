"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export type QuizQuestion = { id: string; text: string; options: string[] };

type Result = { score: number; total: number; passed: boolean };

export default function QuizForm({
  courseId,
  questions,
}: {
  courseId: string;
  questions: QuizQuestion[];
}) {
  const t = useTranslations("courses.learn");
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (answers.some((a) => a === null)) return setError(t("answerAll"));

    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error: err } = await supabase.rpc("submit_quiz", {
      p_course: courseId,
      p_answers: answers,
    });
    setBusy(false);
    if (err || !data) return setError(t("errQuiz"));
    setResult(data as Result);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {questions.map((q, qi) => (
        <fieldset key={q.id} className="rounded-xl border border-navy-900/10 bg-white p-5">
          <legend className="px-1 font-bold text-navy-900">
            {qi + 1}. {q.text}
          </legend>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                  answers[qi] === oi
                    ? "border-gold-500 bg-gold-500/10"
                    : "border-navy-900/15 hover:border-gold-500"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[qi] === oi}
                  onChange={() =>
                    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                  }
                  className="accent-gold-500"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {result && (
        <div
          role="status"
          className={`rounded-lg p-4 text-sm font-semibold ${
            result.passed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
          }`}
        >
          <p>{t("result", { score: result.score, total: result.total })}</p>
          <p>{result.passed ? t("passed") : t("failed")}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-navy-900 px-6 py-2.5 font-bold text-white transition hover:bg-navy-700 disabled:opacity-60"
      >
        {busy ? t("submitting") : t("submitQuiz")}
      </button>
    </form>
  );
}
