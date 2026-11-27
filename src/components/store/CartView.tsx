"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import { lineQty, useCartProducts } from "./useCartProducts";

export default function CartView() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { setQty, remove } = useCart();
  const { lines, products, loading, removed } = useCartProducts();

  if (loading) return <p className="text-navy-700">{t("loading")}</p>;

  if (lines.length === 0) {
    return (
      <div className="space-y-4 rounded-xl bg-slate-50 p-8 text-center">
        {removed && <p className="text-sm text-amber-800">{t("unavailable")}</p>}
        <p className="text-navy-700">{t("empty")}</p>
        <Link
          href="/store"
          className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
        >
          {t("browse")}
        </Link>
      </div>
    );
  }

  const total = lines.reduce((sum, l) => {
    const p = products[l.id];
    return p ? sum + p.price_cents * lineQty(p, l.qty) : sum;
  }, 0);

  return (
    <div className="space-y-6">
      {removed && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t("unavailable")}</p>}
      <ul className="space-y-3">
        {lines.map((l) => {
          const p = products[l.id];
          if (!p) return null;
          return (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy-900/10 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/store/${p.slug}`} className="font-bold text-navy-900 hover:text-gold-600">
                  {locale === "en" ? p.title_en : p.title_ar}
                </Link>
                <div className="text-sm text-navy-700">{formatPrice(p.price_cents)}</div>
              </div>
              {p.is_digital ? (
                <span className="text-xs text-navy-700/80">{t("digitalOne")}</span>
              ) : (
                <label className="flex items-center gap-2 text-sm">
                  {t("qty")}
                  <input
                    type="number"
                    min={1}
                    max={p.stock !== null ? Math.min(20, p.stock) : 20}
                    value={l.qty}
                    onChange={(e) => setQty(l.id, Number(e.target.value))}
                    className="w-20 rounded-lg border border-navy-900/20 px-2 py-1"
                  />
                </label>
              )}
              <div className="w-24 text-end font-bold text-navy-900">
                {formatPrice(p.price_cents * lineQty(p, l.qty))}
              </div>
              <button
                type="button"
                onClick={() => remove(l.id)}
                className="rounded-md border border-navy-900/20 px-2.5 py-1 text-xs font-semibold text-red-700 hover:border-red-500"
              >
                {t("remove")}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-navy-900 p-5 text-white">
        <div>
          <div className="text-sm text-white/70">{t("subtotal")}</div>
          <div className="text-2xl font-extrabold text-gold-400">{formatPrice(total)}</div>
          <div className="mt-1 text-xs text-white/60">{t("indicative")}</div>
        </div>
        <Link
          href="/checkout"
          className="rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
        >
          {t("checkout")}
        </Link>
      </div>
    </div>
  );
}
