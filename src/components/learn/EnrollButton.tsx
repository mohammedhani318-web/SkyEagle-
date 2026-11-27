"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function EnrollButton({ courseId, userId }: { courseId: string; userId: string }) {
  const t = useTranslations("courses");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function enroll() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(false);
    const { error: err } = await supabase
      .from("enrollments")
      .insert({ user_id: userId, course_id: courseId, source: "free" });
    setBusy(false);
    if (err && err.code !== "23505") return setError(true); // 23505 = مسجَّل مسبقًا
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={enroll}
        disabled={busy}
        className="rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-400 disabled:opacity-60"
      >
        {busy ? t("enrolling") : t("enroll")}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {t("errEnroll")}
        </p>
      )}
    </div>
  );
}
