"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = {
  lessonId: string;
  userId: string;
  done: boolean;
};

export default function LessonDoneButton({ lessonId, userId, done }: Props) {
  const t = useTranslations("courses.learn");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    if (done) {
      await supabase.from("lesson_progress").delete().eq("user_id", userId).eq("lesson_id", lessonId);
    } else {
      await supabase.from("lesson_progress").insert({ user_id: userId, lesson_id: lessonId });
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={done}
      className={`rounded-full border px-5 py-2.5 text-sm font-bold transition disabled:opacity-60 ${
        done
          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
          : "border-navy-900 bg-navy-900 text-white hover:bg-navy-700"
      }`}
    >
      {done ? `✓ ${t("markUndone")}` : t("markDone")}
    </button>
  );
}
