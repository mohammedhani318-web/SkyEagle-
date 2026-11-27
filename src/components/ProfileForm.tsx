"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getBrowserClient } from "@/lib/supabase/browser";

type Props = {
  userId: string;
  email: string;
  initial: { displayName: string; bio: string; avatarUrl: string | null };
};

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function ProfileForm({ userId, email, initial }: Props) {
  const t = useTranslations("profile");
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (f && !TYPES[f.type]) {
      e.target.value = "";
      return setError(t("errAvatarType"));
    }
    if (f && f.size > MAX_BYTES) {
      e.target.value = "";
      return setError(t("errAvatarSize"));
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const supabase = getBrowserClient();
    if (!supabase) return setError(t("errSave"));

    setBusy(true);
    try {
      let nextAvatar = avatarUrl;
      if (file) {
        const path = `${userId}/avatar.${TYPES[file.type]}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        nextAvatar = `${data.publicUrl}?v=${Date.now()}`;
      }

      // الكتابة محصورة بأعمدة آمنة (display_name, bio, avatar_url, updated_at)؛
      // الصف يُنشأ تلقائيًا عند التسجيل، ولا يُسمح بتعديل role من هنا.
      const { data: updated, error: dbErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim().slice(0, 80),
          bio: bio.trim().slice(0, 500),
          avatar_url: nextAvatar,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select("id");
      if (dbErr || !updated || updated.length === 0) throw dbErr ?? new Error("no row");

      setAvatarUrl(nextAvatar);
      setFile(null);
      setOk(true);
    } catch {
      setError(t("errSave"));
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-lg border border-navy-900/20 bg-white px-4 py-2.5 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-2 ring-gold-500"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-900 text-3xl text-gold-400">
            {(displayName || email).charAt(0).toUpperCase()}
          </span>
        )}
        <label className="block text-sm font-semibold">
          {t("avatar")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFile}
            className="mt-1 block text-sm font-normal"
          />
          <span className="mt-1 block text-xs font-normal text-navy-700/70">
            {t("avatarHint")}
          </span>
        </label>
      </div>

      <label className="block text-sm font-semibold">
        {t("email")}
        <input value={email} readOnly dir="ltr" className={`${input} mt-1 bg-slate-100`} />
      </label>

      <label className="block text-sm font-semibold">
        {t("displayName")}
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          required
          className={`${input} mt-1`}
        />
      </label>

      <label className="block text-sm font-semibold">
        {t("bio")}
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={t("bioPlaceholder")}
          className={`${input} mt-1`}
        />
      </label>

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
