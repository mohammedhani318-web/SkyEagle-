"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export type JobRow = {
  id: string;
  kind: "job" | "training";
  title_ar: string;
  title_en: string;
  company: string;
  location: string;
  description_ar: string;
  description_en: string;
  apply_url: string | null;
  expires_at: string | null;
  published: boolean;
};

const BLANK: Omit<JobRow, "id"> = {
  kind: "job",
  title_ar: "",
  title_en: "",
  company: "",
  location: "",
  description_ar: "",
  description_en: "",
  apply_url: "",
  expires_at: "",
  published: false,
};

export default function JobsAdmin({
  jobs,
  canDelete,
  locale,
}: {
  jobs: JobRow[];
  canDelete: boolean;
  locale: string;
}) {
  const t = useTranslations("adminP5.jobs");
  const kinds = useTranslations("jobs.kind");
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Omit<JobRow, "id">>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function startEdit(j: JobRow | null) {
    setError(null);
    if (j) {
      const { id, ...rest } = j;
      void id;
      setForm({ ...rest, apply_url: rest.apply_url ?? "", expires_at: rest.expires_at ?? "" });
      setEditing(j.id);
    } else {
      setForm(BLANK);
      setEditing("new");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const url = (form.apply_url ?? "").trim();
    if (url && !url.startsWith("https://")) return setError(t("errSave"));
    if (!form.title_ar.trim() || !form.title_en.trim() || !form.company.trim()) return setError(t("errSave"));

    const supabase = getBrowserClient();
    if (!supabase) return;
    const payload = {
      kind: form.kind,
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      description_ar: form.description_ar.trim(),
      description_en: form.description_en.trim(),
      apply_url: url || null,
      expires_at: form.expires_at ? form.expires_at : null,
      published: form.published,
    };
    setBusy(true);
    const { data, error: err } =
      editing === "new"
        ? await supabase.from("jobs").insert(payload).select("id")
        : await supabase.from("jobs").update(payload).eq("id", editing!).select("id");
    setBusy(false);
    if (err || !data || data.length === 0) return setError(t("errSave"));
    setEditing(null);
    router.refresh();
  }

  async function togglePublish(j: JobRow) {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { error: err } = await supabase.from("jobs").update({ published: !j.published }).eq("id", j.id);
    if (err) return setError(t("errAction"));
    router.refresh();
  }

  async function remove(j: JobRow) {
    if (!window.confirm(t("confirmDelete"))) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { error: err, count } = await supabase.from("jobs").delete({ count: "exact" }).eq("id", j.id);
    if (err || !count) return setError(t("errAction"));
    router.refresh();
  }

  const field =
    "w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";
  const label = "block text-sm font-semibold text-navy-900";
  const btn = "rounded-md border border-navy-900/20 px-2.5 py-1 text-xs font-semibold hover:border-gold-500";
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      {editing === null && (
        <button
          type="button"
          onClick={() => startEdit(null)}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400"
        >
          + {t("new")}
        </button>
      )}

      {error && editing === null && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {editing !== null && (
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              {t("kind")}
              <select value={form.kind} onChange={(e) => set("kind", e.target.value as JobRow["kind"])} className={`${field} mt-1`}>
                <option value="job">{kinds("job")}</option>
                <option value="training">{kinds("training")}</option>
              </select>
            </label>
            <label className={label}>
              {t("company")}
              <input value={form.company} onChange={(e) => set("company", e.target.value)} required className={`${field} mt-1`} />
            </label>
            <label className={label}>
              {t("titleAr")}
              <input dir="rtl" value={form.title_ar} onChange={(e) => set("title_ar", e.target.value)} required className={`${field} mt-1`} />
            </label>
            <label className={label}>
              {t("titleEn")}
              <input dir="ltr" value={form.title_en} onChange={(e) => set("title_en", e.target.value)} required className={`${field} mt-1`} />
            </label>
            <label className={label}>
              {t("descAr")}
              <textarea dir="rtl" rows={4} value={form.description_ar} onChange={(e) => set("description_ar", e.target.value)} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              {t("descEn")}
              <textarea dir="ltr" rows={4} value={form.description_en} onChange={(e) => set("description_en", e.target.value)} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              {t("location")}
              <input value={form.location} onChange={(e) => set("location", e.target.value)} className={`${field} mt-1`} />
            </label>
            <label className={label}>
              {t("expires")}
              <input type="date" value={form.expires_at ?? ""} onChange={(e) => set("expires_at", e.target.value)} className={`${field} mt-1`} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              {t("applyUrl")}
              <input dir="ltr" value={form.apply_url ?? ""} onChange={(e) => set("apply_url", e.target.value)} placeholder="https://" className={`${field} mt-1`} />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 accent-gold-500" />
              {t("published")}
            </label>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="rounded-lg bg-navy-900 px-5 py-2 font-bold text-white hover:bg-navy-700 disabled:opacity-60">
              {t("save")}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-navy-900/20 px-5 py-2 font-semibold hover:border-gold-500">
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy-900/20 bg-slate-50 p-8 text-navy-700">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-900/10 bg-white p-4">
              <div>
                <div className="font-semibold text-navy-900">{locale === "ar" ? j.title_ar : j.title_en}</div>
                <div className="text-xs text-navy-700/80">
                  {kinds(j.kind)} · {j.company}
                  {j.published ? "" : " · —"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn} onClick={() => startEdit(j)}>{t("edit")}</button>
                <button type="button" className={btn} onClick={() => togglePublish(j)}>
                  {j.published ? t("unpublish") : t("publish")}
                </button>
                {canDelete && (
                  <button type="button" className={`${btn} text-red-700`} onClick={() => remove(j)}>
                    {t("delete")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
