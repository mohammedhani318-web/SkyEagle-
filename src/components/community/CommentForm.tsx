"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function CommentForm({ threadId, userId }: { threadId: string; userId: string }) {
  const t = useTranslations("community");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [rate, setRate] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setRate(false);
    if (!body.trim()) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error: err } = await supabase
      .from("community_comments")
      .insert({ thread_id: threadId, user_id: userId, body: body.trim() });
    setBusy(false);
    if (err) {
      if (err.message.includes("rate_limited")) return setRate(true);
      return setError(true);
    }
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={3000}
        rows={4}
        required
        placeholder={t("replyPlaceholder")}
        aria-label={t("reply")}
        className="w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
      />
      {rate && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {t("errRate")}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {t("errPost")}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-navy-900 px-5 py-2 font-bold text-white hover:bg-navy-700 disabled:opacity-60"
      >
        {busy ? t("posting") : t("reply")}
      </button>
    </form>
  );
}
