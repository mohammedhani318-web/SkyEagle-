"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";
import { SEED_ARTICLES } from "@/data/articles";

export default function SeedButton() {
  const t = useTranslations("admin.articles");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    setFailed(false);

    const rows = SEED_ARTICLES.map((a) => ({
      slug: a.slug,
      category: a.category,
      kind: a.kind,
      access: a.access,
      read_minutes: a.readMinutes,
      published: true,
      published_at: a.publishedAt,
      title_ar: a.title.ar,
      title_en: a.title.en,
      excerpt_ar: a.excerpt.ar,
      excerpt_en: a.excerpt.en,
      body_ar: a.body.ar.join("\n\n"),
      body_en: a.body.en.join("\n\n"),
    }));

    const { error } = await supabase.from("articles").upsert(rows, { onConflict: "slug" });
    setBusy(false);
    if (error) {
      setFailed(true);
      return setMsg(t("errAction"));
    }
    setMsg(t("importDone"));
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-lg border border-navy-900/20 px-4 py-2 text-sm font-semibold hover:border-gold-500 disabled:opacity-50"
      >
        {t("importSample")}
      </button>
      <p className="text-xs text-navy-700/80">{t("importHint")}</p>
      {msg && (
        <p role="status" className={`text-sm ${failed ? "text-red-700" : "text-emerald-700"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
