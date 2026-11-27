"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getBrowserClient } from "@/lib/supabase/browser";

type Item = { name: string; url: string; isVideo: boolean; size: number };

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
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
  return `${Date.now()}-${base || "file"}${ext ? `.${ext}` : ""}`;
}

export default function MediaManager() {
  const t = useTranslations("admin.media");
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { data } = await supabase.storage
      .from("media")
      .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    setItems(
      (data ?? [])
        .filter((f) => f.name && f.id)
        .map((f) => ({
          name: f.name,
          url: supabase.storage.from("media").getPublicUrl(f.name).data.publicUrl,
          isVideo: /\.(mp4|webm)$/i.test(f.name),
          size: Number(f.metadata?.size ?? 0),
        })),
    );
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type) || file.size > MAX_BYTES)
      return setError(t("errUpload"));

    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const { error: err } = await supabase.storage
      .from("media")
      .upload(safeName(file.name), file, { contentType: file.type });
    setBusy(false);
    if (err) return setError(t("errUpload"));
    await load();
  }

  async function remove(name: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    setError(null);
    const { data, error: err } = await supabase.storage.from("media").remove([name]);
    if (err || !data || data.length === 0) return setError(t("errUpload"));
    await load();
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* الحافظة غير متاحة */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="cursor-pointer rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400">
          {busy ? "…" : `+ ${t("upload")}`}
          <input
            type="file"
            accept={ALLOWED.join(",")}
            onChange={onUpload}
            disabled={busy}
            className="sr-only"
          />
        </label>
        <span className="text-xs text-navy-700/80">{t("hint")}</span>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <li
              key={it.name}
              className="overflow-hidden rounded-xl border border-navy-900/10 bg-white shadow-sm"
            >
              <div className="flex aspect-video items-center justify-center bg-slate-100">
                {it.isVideo ? (
                  <video src={it.url} controls preload="metadata" className="h-full w-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="space-y-2 p-3">
                <div dir="ltr" className="truncate text-start text-xs text-navy-700">
                  {it.name}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copy(it.url)}
                    className="rounded-md border border-navy-900/20 px-2.5 py-1 text-xs font-semibold hover:border-gold-500"
                  >
                    {copied === it.url ? t("copied") : t("copy")}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.name)}
                    className="rounded-md border border-navy-900/20 px-2.5 py-1 text-xs font-semibold text-red-700 hover:border-red-500"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
