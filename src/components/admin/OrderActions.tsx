"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

type Status = "pending" | "paid" | "cancelled" | "refunded";

export default function OrderActions({ orderId, status }: { orderId: string; status: Status }) {
  const t = useTranslations("adminP6.orders");
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function run(next: "paid" | "cancelled" | "refunded") {
    if (!window.confirm(t("confirmAction"))) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(false);
    const { error: err } = await supabase.rpc("admin_set_order_status", {
      p_order: orderId,
      p_status: next,
      p_ref: next === "paid" ? ref.trim() || null : null,
    });
    setBusy(false);
    if (err) return setError(true);
    router.refresh();
  }

  if (status === "cancelled" || status === "refunded") return null;

  const btn =
    "rounded-md border border-navy-900/20 px-3 py-1.5 text-xs font-semibold hover:border-gold-500 disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "pending" && (
        <>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            maxLength={200}
            placeholder={t("paymentRef")}
            aria-label={t("paymentRef")}
            className="w-48 rounded-md border border-navy-900/20 px-2 py-1 text-xs"
          />
          <button type="button" disabled={busy} onClick={() => run("paid")} className={`${btn} bg-emerald-50 text-emerald-800`}>
            {t("markPaid")}
          </button>
          <button type="button" disabled={busy} onClick={() => run("cancelled")} className={`${btn} text-red-700`}>
            {t("cancel")}
          </button>
        </>
      )}
      {status === "paid" && (
        <button type="button" disabled={busy} onClick={() => run("refunded")} className={`${btn} text-red-700`}>
          {t("refund")}
        </button>
      )}
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {t("errAction")}
        </span>
      )}
    </div>
  );
}
