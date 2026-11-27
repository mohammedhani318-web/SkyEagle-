"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/browser";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const supabase = getBrowserClient();
    if (!supabase) return setError(t("notConfigured"));

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    if (isSignup && password.length < 8) return setError(t("errShortPassword"));

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
          },
        });
        if (error) return setError(t("errGeneric"));
        // البريد المسجّل مسبقًا يعيد مستخدمًا دون هويات (حماية من كشف الحسابات)
        if (data.user && data.user.identities?.length === 0)
          return setError(t("errExists"));
        if (!data.session) return setInfo(t("checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setError(t("errInvalid"));
      }
      router.push("/profile");
      router.refresh();
    } catch {
      setError(t("errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const supabase = getBrowserClient();
    if (!supabase) return setError(t("notConfigured"));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/${locale}/auth/callback` },
    });
    if (error) setError(t("errGeneric"));
  }

  const input =
    "w-full rounded-lg border border-navy-900/20 bg-white px-4 py-2.5 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 text-navy-900 shadow-xl">
      <h1 className="text-2xl font-extrabold">
        {isSignup ? t("signupTitle") : t("loginTitle")}
      </h1>
      <p className="mt-1 mb-6 text-sm text-navy-700">
        {isSignup ? t("signupSubtitle") : t("loginSubtitle")}
      </p>

      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {t("notConfigured")}
        </p>
      )}

      <button
        type="button"
        onClick={onGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-navy-900/20 px-4 py-2.5 font-semibold transition hover:border-gold-500"
      >
        <span aria-hidden="true" className="font-extrabold text-sky-accent">G</span>
        {t("google")}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-navy-700/70">
        <span className="h-px flex-1 bg-navy-900/10" />
        {t("or")}
        <span className="h-px flex-1 bg-navy-900/10" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
        {isSignup && (
          <label className="block text-sm font-semibold">
            {t("name")}
            <input name="name" type="text" required autoComplete="name" maxLength={80} className={`${input} mt-1`} />
          </label>
        )}
        <label className="block text-sm font-semibold">
          {t("email")}
          <input name="email" type="email" required autoComplete="email" dir="ltr" className={`${input} mt-1`} />
        </label>
        <label className="block text-sm font-semibold">
          {t("password")}
          <input
            name="password"
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            dir="ltr"
            className={`${input} mt-1`}
          />
          {isSignup && (
            <span className="mt-1 block text-xs font-normal text-navy-700/70">
              {t("passwordHint")}
            </span>
          )}
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-navy-900 px-4 py-2.5 font-bold text-white transition hover:bg-navy-700 disabled:opacity-60"
        >
          {busy ? t("loading") : isSignup ? t("submitSignup") : t("submitLogin")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-700">
        {isSignup ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-bold text-gold-600 hover:text-gold-500"
        >
          {isSignup ? t("loginTitle") : t("signupTitle")}
        </Link>
      </p>
    </div>
  );
}
