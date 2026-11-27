"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";
import Logo from "./Logo";
import { useCart } from "./store/CartProvider";

const NAV = ["aviation", "space", "maintenance", "library", "jobs", "courses", "community", "store"] as const;

export default function Header() {
  const t = useTranslations("nav");
  const brand = useTranslations("brand");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const otherLocale = locale === "ar" ? "en" : "ar";

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(!!session),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getBrowserClient();
    await supabase?.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const pill =
    "rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:border-gold-400 hover:text-gold-400";

  return (
    <header className="sticky top-0 z-50 print:hidden border-b border-white/10 bg-navy-950/90 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo tagline={brand("tagline")} />
        </Link>

        <nav className="hidden items-center gap-5 text-sm lg:flex" aria-label="Main">
          {NAV.map((key) => (
            <Link
              key={key}
              href={`/${key}`}
              className="text-white/80 transition hover:text-gold-400"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className={`${pill} relative`} aria-label={t("cart")}>
            🛒
            {count > 0 && (
              <span className="ms-1 rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-navy-950">
                {count}
              </span>
            )}
          </Link>
          <Link href={pathname} locale={otherLocale} className={pill}>
            {t("language")}
          </Link>
          {signedIn ? (
            <>
              <Link href="/favorites" className={`${pill} hidden sm:inline-block`}>
                ★ {t("favorites")}
              </Link>
              <Link href="/orders" className={`${pill} hidden md:inline-block`}>
                {t("orders")}
              </Link>
              <Link
                href="/profile"
                className="hidden rounded-full bg-gold-500 px-4 py-1.5 text-sm font-bold text-navy-950 transition hover:bg-gold-400 sm:inline-block"
              >
                {t("profile")}
              </Link>
              <button type="button" onClick={signOut} className={`${pill} hidden sm:inline-block`}>
                {t("logout")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-gold-500 px-4 py-1.5 text-sm font-bold text-navy-950 transition hover:bg-gold-400 sm:inline-block"
            >
              {t("login")}
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 lg:hidden"
            aria-expanded={open}
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-navy-900 px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="grid gap-1">
            {NAV.map((key) => (
              <li key={key}>
                <Link
                  href={`/${key}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-white/90 hover:bg-white/10"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
            {signedIn ? (
              <>
                <li>
                  <Link
                    href="/favorites"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-white/90 hover:bg-white/10"
                  >
                    ★ {t("favorites")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-white/90 hover:bg-white/10"
                  >
                    {t("orders")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="mt-2 block rounded-lg bg-gold-500 px-3 py-2.5 text-center font-bold text-navy-950"
                  >
                    {t("profile")}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-1 block w-full rounded-lg px-3 py-2.5 text-center text-white/80 hover:bg-white/10"
                  >
                    {t("logout")}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg bg-gold-500 px-3 py-2.5 text-center font-bold text-navy-950"
                >
                  {t("login")}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
