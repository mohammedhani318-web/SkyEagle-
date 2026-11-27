"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const t = useTranslations("orders");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function cancel() {
    if (!window.confirm(t("confirmCancel"))) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(false);
    const { error: err } = await supabase.rpc("cancel_my_order", { p_order: orderId });
    setBusy(false);
    if (err) return setError(true);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={cancel}
        disabled={busy}
        className="rounded-md border border-navy-900/20 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-500 disabled:opacity-50"
      >
        {t("cancel")}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {t("errCancel")}
        </span>
      )}
    </div>
  );
}
