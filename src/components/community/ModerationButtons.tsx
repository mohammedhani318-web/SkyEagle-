"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = {
  table: "community_threads" | "community_comments";
  id: string;
  hidden: boolean;
  canHide: boolean; // طاقم
  canDelete: boolean; // صاحب المحتوى أو الطاقم
  afterDelete?: string; // مسار بعد حذف نقاش
};

export default function ModerationButtons({ table, id, hidden, canHide, canDelete, afterDelete }: Props) {
  const t = useTranslations("community");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleHidden() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.from(table).update({ hidden: !hidden }).eq("id", id);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(t("confirmDelete"))) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.from(table).delete().eq("id", id);
    setBusy(false);
    if (afterDelete) router.push(afterDelete);
    router.refresh();
  }

  const btn =
    "rounded-md border border-navy-900/20 px-2.5 py-1 text-xs font-semibold hover:border-gold-500 disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      {canHide && (
        <button type="button" onClick={toggleHidden} disabled={busy} className={btn}>
          {hidden ? t("unhide") : t("hide")}
        </button>
      )}
      {canDelete && (
        <button type="button" onClick={remove} disabled={busy} className={`${btn} text-red-700 hover:border-red-500`}>
          {t("delete")}
        </button>
      )}
    </div>
  );
}
