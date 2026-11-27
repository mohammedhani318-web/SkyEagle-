"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export type EditorValues = {
  id: string | null;
  slug: string;
  category: "aviation" | "space" | "maintenance";
  kind: "article" | "reference" | "book";
  access: "free" | "paid";
  read_minutes: number;
  published: boolean;
  published_at: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  body_ar: string;
  body_en: string;
};

export const EMPTY_ARTICLE: EditorValues = {
  id: null,
  slug: "",
  category: "aviation",
  kind: "article",
  access: "free",
  read_minutes: 3,
  published: false,
  published_at: new Date().toISOString().slice(0, 10),
  title_ar: "",
  title_en: "",
  excerpt_ar: "",
  excerpt_en: "",
  body_ar: "",
  body_en: "",
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function ArticleEditor({ initial }: { initial: EditorValues }) {
  const t = useTranslations("admin.editor");
  const cat = useTranslations("articles.categories");
  const kinds = useTranslations("articles.kinds");
  const access = useTranslations("articles");
  const router = useRouter();

  const [v, setV] = useState<EditorValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof EditorValues>(k: K, val: EditorValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const slug = v.slug.trim();
    if (!SLUG_RE.test(slug) || slug.length > 120) return setError(t("errSlug"));
    if (!v.title_ar.trim() || !v.title_en.trim()) return setError(t("errRequired"));

    const supabase = getBrowserClient();
    if (!supabase) return setError(t("errSave"));

    const payload = {
      slug,
      category: v.category,
      kind: v.kind,
      access: v.access,
      read_minutes: Math.min(Math.max(Math.round(v.read_minutes) || 1, 1), 240),
      published: v.published,
      published_at: v.published_at,
      title_ar: v.title_ar.trim(),
      title_en: v.title_en.trim(),
      excerpt_ar: v.excerpt_ar.trim(),
      excerpt_en: v.excerpt_en.trim(),
      body_ar: v.body_ar.trim(),
      body_en: v.body_en.trim(),
    };

    setBusy(true);
    const { error: err, data } = v.id
      ? await supabase.from("articles").update(payload).eq("id", v.id).select("id")
      : await supabase.from("articles").insert(payload).select("id");
    setBusy(false);

    if (err) return setError(err.code === "23505" ? t("errDuplicate") : t("errSave"));
    if (!data || data.length === 0) return setError(t("errSave")); // RLS منع التعديل

    setOk(true);
    router.push("/admin/articles");
    router.refresh();
  }

  const field =
    "w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";
  const label = "block text-sm font-semibold text-navy-900";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          {t("slug")}
          <input
            value={v.slug}
            onChange={(e) => set("slug", e.target.value)}
            dir="ltr"
            required
            className={`${field} mt-1`}
          />
          <span className="mt-1 block text-xs font-normal text-navy-700/70">
            {t("slugHint")}
          </span>
        </label>

        <label className={label}>
          {t("category")}
          <select
            value={v.category}
            onChange={(e) => set("category", e.target.value as EditorValues["category"])}
            className={`${field} mt-1`}
          >
            {(["aviation", "space", "maintenance"] as const).map((c) => (
              <option key={c} value={c}>
                {cat(c)}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          {t("kind")}
          <select
            value={v.kind}
            onChange={(e) => set("kind", e.target.value as EditorValues["kind"])}
            className={`${field} mt-1`}
          >
            {(["article", "reference", "book"] as const).map((k) => (
              <option key={k} value={k}>
                {kinds(k)}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          {t("access")}
          <select
            value={v.access}
            onChange={(e) => set("access", e.target.value as EditorValues["access"])}
            className={`${field} mt-1`}
          >
            <option value="free">{access("free")}</option>
            <option value="paid">{access("paid")}</option>
          </select>
        </label>

        <label className={label}>
          {t("readMinutes")}
          <input
            type="number"
            min={1}
            max={240}
            value={v.read_minutes}
            onChange={(e) => set("read_minutes", Number(e.target.value))}
            className={`${field} mt-1`}
          />
        </label>

        <label className={label}>
          {t("publishedAt")}
          <input
            type="date"
            value={v.published_at}
            onChange={(e) => set("published_at", e.target.value)}
            required
            className={`${field} mt-1`}
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-navy-900">
          <input
            type="checkbox"
            checked={v.published}
            onChange={(e) => set("published", e.target.checked)}
            className="h-4 w-4 accent-gold-500"
          />
          {t("published")}
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset className="space-y-4" dir="rtl">
          <label className={label}>
            {t("titleAr")}
            <input
              value={v.title_ar}
              onChange={(e) => set("title_ar", e.target.value)}
              required
              className={`${field} mt-1`}
            />
          </label>
          <label className={label}>
            {t("excerptAr")}
            <textarea
              value={v.excerpt_ar}
              onChange={(e) => set("excerpt_ar", e.target.value)}
              rows={2}
              className={`${field} mt-1`}
            />
          </label>
          <label className={label}>
            {t("bodyAr")}
            <textarea
              value={v.body_ar}
              onChange={(e) => set("body_ar", e.target.value)}
              rows={12}
              className={`${field} mt-1`}
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4" dir="ltr">
          <label className={label}>
            {t("titleEn")}
            <input
              value={v.title_en}
              onChange={(e) => set("title_en", e.target.value)}
              required
              className={`${field} mt-1`}
            />
          </label>
          <label className={label}>
            {t("excerptEn")}
            <textarea
              value={v.excerpt_en}
              onChange={(e) => set("excerpt_en", e.target.value)}
              rows={2}
              className={`${field} mt-1`}
            />
          </label>
          <label className={label}>
            {t("bodyEn")}
            <textarea
              value={v.body_en}
              onChange={(e) => set("body_en", e.target.value)}
              rows={12}
              className={`${field} mt-1`}
            />
          </label>
        </fieldset>
      </div>
      <p className="text-xs text-navy-700/70">{t("bodyHint")}</p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {t("saved")}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-navy-900 px-6 py-2.5 font-bold text-white transition hover:bg-navy-700 disabled:opacity-60"
      >
        {t("save")}
      </button>
    </form>
  );
}
