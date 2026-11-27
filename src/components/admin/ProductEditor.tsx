"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export type ProductValues = {
  id: string;
  slug: string;
  kind: "book" | "file" | "merch" | "course";
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  image_url: string;
  is_digital: boolean;
  stock: string; // فارغ = غير محدود
  course_id: string;
  file_path: string;
  published: boolean;
};

export type CourseOption = { id: string; title: string };

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FILE_TYPES = [
  "application/pdf",
  "application/zip",
  "application/epub+zip",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const MAX_BYTES = 50 * 1024 * 1024;

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

export default function ProductEditor({
  initial,
  courses,
}: {
  initial: ProductValues;
  courses: CourseOption[];
}) {
  const t = useTranslations("adminP6.products");
  const kinds = useTranslations("store.kindOne");
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProductValues>(k: K, val: ProductValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const isCourse = v.kind === "course";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!FILE_TYPES.includes(file.type) || file.size > MAX_BYTES) return setError(t("errFile"));

    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const path = `${v.id}/${Date.now()}-${safeName(file.name)}`;
    const { error: err } = await supabase.storage
      .from("downloads")
      .upload(path, file, { contentType: file.type });
    if (err) {
      setBusy(false);
      return setError(t("errFile"));
    }
    // حذف الملف السابق (إن وُجد) حتى لا تتراكم ملفات غير مستخدمة
    if (v.file_path) await supabase.storage.from("downloads").remove([v.file_path]);
    setBusy(false);
    set("file_path", path);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const slug = v.slug.trim();
    if (!SLUG_RE.test(slug) || slug.length > 120) return setError(t("errSlug"));
    if (!v.title_ar.trim() || !v.title_en.trim()) return setError(t("errRequired"));
    const image = v.image_url.trim();
    if (image && !image.startsWith("https://")) return setError(t("errImage"));
    if (isCourse && !v.course_id) return setError(t("errCourse"));

    const supabase = getBrowserClient();
    if (!supabase) return setError(t("errSave"));

    const stockNum = v.stock.trim() === "" ? null : Math.max(0, Math.floor(Number(v.stock)));
    setBusy(true);
    const { error: err } = await supabase.from("products").upsert({
      id: v.id,
      slug,
      kind: v.kind,
      title_ar: v.title_ar.trim(),
      title_en: v.title_en.trim(),
      description_ar: v.description_ar.trim(),
      description_en: v.description_en.trim(),
      price_cents: Math.max(0, Math.round(v.price * 100)),
      image_url: image || null,
      is_digital: isCourse ? true : v.is_digital,
      stock: isCourse || v.is_digital ? null : Number.isNaN(stockNum) ? null : stockNum,
      course_id: isCourse ? v.course_id : null,
      file_path: !isCourse && v.is_digital ? v.file_path || null : null,
      published: v.published,
    });
    setBusy(false);
    if (err) return setError(err.code === "23505" ? t("errDuplicate") : t("errSave"));

    setOk(true);
    router.push("/admin/products");
    router.refresh();
  }

  const field =
    "w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";
  const label = "block text-sm font-semibold text-navy-900";

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          {t("slug")}
          <input value={v.slug} onChange={(e) => set("slug", e.target.value)} dir="ltr" required className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("titleAr")}
          <input dir="rtl" value={v.title_ar} onChange={(e) => set("title_ar", e.target.value)} required className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("titleEn")}
          <input dir="ltr" value={v.title_en} onChange={(e) => set("title_en", e.target.value)} required className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("descAr")}
          <textarea dir="rtl" rows={4} value={v.description_ar} onChange={(e) => set("description_ar", e.target.value)} className={`${field} mt-1`} />
        </label>
        <label className={label}>
          {t("descEn")}
          <textarea dir="ltr" rows={4} value={v.description_en} onChange={(e) => set("description_en", e.target.value)} className={`${field} mt-1`} />
        </label>

        <label className={label}>
          {t("kind")}
          <select value={v.kind} onChange={(e) => set("kind", e.target.value as ProductValues["kind"])} className={`${field} mt-1`}>
            {(["book", "file", "merch", "course"] as const).map((k) => (
              <option key={k} value={k}>
                {kinds(k)}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t("price")}
          <input type="number" min={0} step="0.01" value={v.price} onChange={(e) => set("price", Number(e.target.value))} className={`${field} mt-1`} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          {t("image")}
          <input dir="ltr" value={v.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://" className={`${field} mt-1`} />
        </label>

        {isCourse ? (
          <label className={`${label} sm:col-span-2`}>
            {t("course")}
            <select value={v.course_id} onChange={(e) => set("course_id", e.target.value)} className={`${field} mt-1`}>
              <option value="">{t("none")}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <input type="checkbox" checked={v.is_digital} onChange={(e) => set("is_digital", e.target.checked)} className="h-4 w-4 accent-gold-500" />
              {t("digital")}
            </label>
            {!v.is_digital && (
              <label className={label}>
                {t("stock")}
                <input type="number" min={0} value={v.stock} onChange={(e) => set("stock", e.target.value)} className={`${field} mt-1`} />
                <span className="mt-1 block text-xs font-normal text-navy-700/70">{t("stockHint")}</span>
              </label>
            )}
            {v.is_digital && (
              <div className={`${label} sm:col-span-2`}>
                {t("file")}
                <input type="file" accept={FILE_TYPES.join(",")} onChange={onFile} disabled={busy} className="mt-1 block text-sm font-normal" />
                <span className="mt-1 block text-xs font-normal text-navy-700/70">{t("fileHint")}</span>
                {v.file_path && (
                  <span dir="ltr" className="mt-1 block text-start text-xs font-normal text-navy-700">
                    {t("fileCurrent")}: {v.file_path}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        <label className="flex items-center gap-2 text-sm font-semibold text-navy-900">
          <input type="checkbox" checked={v.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-gold-500" />
          {t("published")}
        </label>
      </div>
      <p className="text-xs text-navy-700/70">{t("deleteHint")}</p>

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
      <button type="submit" disabled={busy} className="rounded-lg bg-navy-900 px-6 py-2.5 font-bold text-white hover:bg-navy-700 disabled:opacity-60">
        {t("save")}
      </button>
    </form>
  );
}
