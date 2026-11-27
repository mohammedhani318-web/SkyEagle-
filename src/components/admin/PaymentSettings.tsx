"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function PaymentSettings({ ar, en }: { ar: string; en: string }) {
  const t = useTranslations("adminP6.orders");
  const [valueAr, setValueAr] = useState(ar);
  const [valueEn, setValueEn] = useState(en);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from("site_settings").upsert({
      key: "payment_instructions",
      value_ar: valueAr.trim().slice(0, 2000),
      value_en: valueEn.trim().slice(0, 2000),
    });
    setBusy(false);
    setMsg(error ? { ok: false, text: t("errAction") } : { ok: true, text: t("saved") });
  }

  const field =
    "w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-sm text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-navy-900">{t("settingsTitle")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          {t("instructionsAr")}
          <textarea dir="rtl" rows={4} value={valueAr} onChange={(e) => setValueAr(e.target.value)} className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-semibold">
          {t("instructionsEn")}
          <textarea dir="ltr" rows={4} value={valueEn} onChange={(e) => setValueEn(e.target.value)} className={`${field} mt-1`} />
        </label>
      </div>
      <p className="text-xs text-navy-700/80">{t("gatewayNote")}</p>
      {msg && (
        <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="rounded-lg bg-navy-900 px-5 py-2 font-bold text-white hover:bg-navy-700 disabled:opacity-60">
        {t("saveSettings")}
      </button>
    </form>
  );
}
