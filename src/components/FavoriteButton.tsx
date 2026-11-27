"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function FavoriteButton({ slug }: { slug: string }) {
  const t = useTranslations("favorites");
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (uid) {
        const { data: row } = await supabase
          .from("favorites")
          .select("article_slug")
          .eq("user_id", uid)
          .eq("article_slug", slug)
          .maybeSingle();
        if (!cancelled) setSaved(!!row);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // بدون مفاتيح Supabase لا نعرض شيئًا
  if (!getBrowserClient()) return null;
  if (!ready) return <div className="h-10" aria-hidden="true" />;

  if (!userId) {
    return (
      <Link
        href="/login"
        className="inline-block rounded-full border border-navy-900/20 px-4 py-2 text-sm font-semibold text-navy-900 hover:border-gold-500"
      >
        ☆ {t("loginToSave")}
      </Link>
    );
  }

  async function toggle() {
    const supabase = getBrowserClient();
    if (!supabase || !userId || busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next); // تحديث متفائل
    const { error } = next
      ? await supabase.from("favorites").insert({ user_id: userId, article_slug: slug })
      : await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("article_slug", slug);
    if (error) setSaved(!next);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        saved
          ? "border-gold-500 bg-gold-500/15 text-gold-600"
          : "border-navy-900/20 text-navy-900 hover:border-gold-500"
      }`}
    >
      {saved ? "★" : "☆"} {saved ? t("remove") : t("add")}
    </button>
  );
}
