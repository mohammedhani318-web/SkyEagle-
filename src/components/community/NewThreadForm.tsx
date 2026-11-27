"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function NewThreadForm({ userId }: { userId: string }) {
  const t = useTranslations("community");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [rate, setRate] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setRate(false);
    if (title.trim().length < 3 || !body.trim()) return setError(true);
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error: err } = await supabase
      .from("community_threads")
      .insert({ user_id: userId, title: title.trim(), body: body.trim() })
      .select("id")
      .single();
    setBusy(false);
    if (err || !data) {
      if (err?.message.includes("rate_limited")) return setRate(true);
      return setError(true);
    }
    router.push(`/community/${data.id}`);
  }

  const field =
    "w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-navy-900">{t("new")}</h2>
      <label className="block text-sm font-semibold">
        {t("titleLabel")}
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required className={`${field} mt-1`} />
      </label>
      <label className="block text-sm font-semibold">
        {t("bodyLabel")}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={5} required className={`${field} mt-1`} />
      </label>
      <p className="text-xs text-navy-700/80">{t("rules")}</p>
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
        {busy ? t("posting") : t("post")}
      </button>
    </form>
  );
}
