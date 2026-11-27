"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = {
  id: string;
  published: boolean;
  canDelete: boolean;
  /** الجدول المستهدف (الافتراضي: articles) */
  table?: "articles" | "courses" | "products";
  /** مسار صفحة التعديل (الافتراضي: /admin/articles) */
  editBase?: string;
};

export default function ArticleRowActions({
  id,
  published,
  canDelete,
  table = "articles",
  editBase = "/admin/articles",
}: Props) {
  const t = useTranslations("admin.articles");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function togglePublish() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(false);
    const { error: err } = await supabase
      .from(table)
      .update({ published: !published })
      .eq("id", id);
    setBusy(false);
    if (err) return setError(true);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(t("confirmDelete"))) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(false);
    const { error: err, count } = await supabase
      .from(table)
      .delete({ count: "exact" })
      .eq("id", id);
    setBusy(false);
    // RLS قد يمنع الحذف دون خطأ صريح؛ نتحقق من عدد الصفوف المحذوفة
    if (err || !count) return setError(true);
    router.refresh();
  }

  const btn =
    "rounded-md border border-navy-900/20 px-2.5 py-1 text-xs font-semibold hover:border-gold-500 disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`${editBase}/${id}`} className={btn}>
        ✎
      </Link>
      <button type="button" onClick={togglePublish} disabled={busy} className={btn}>
        {published ? t("unpublish") : t("publish")}
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className={`${btn} text-red-700 hover:border-red-500`}
        >
          {t("delete")}
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
