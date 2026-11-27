"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import { lineQty, useCartProducts } from "./useCartProducts";

type Shipping = { name: string; phone: string; address: string; city: string; country: string };

export default function CheckoutForm({ instructions }: { instructions: string }) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { clear } = useCart();
  const { lines, products, loading } = useCartProducts();
  const [ship, setShip] = useState<Shipping>({ name: "", phone: "", address: "", city: "", country: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="text-navy-700">…</p>;

  if (lines.length === 0) {
    return (
      <div className="space-y-4 rounded-xl bg-slate-50 p-8 text-center">
        <p className="text-navy-700">{t("empty")}</p>
        <Link href="/store" className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400">
          {t("browse")}
        </Link>
      </div>
    );
  }

  const needShipping = lines.some((l) => products[l.id] && !products[l.id].is_digital);
  const total = lines.reduce((s, l) => {
    const p = products[l.id];
    return p ? s + p.price_cents * lineQty(p, l.qty) : s;
  }, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getBrowserClient();
    if (!supabase) return setError(t("errGeneric"));

    if (needShipping && Object.values(ship).some((v) => !v.trim())) return setError(t("errShipping"));

    setBusy(true);
    const { data, error: err } = await supabase.rpc("create_order", {
      p_items: lines.map((l) => ({ product_id: l.id, qty: l.qty })),
      p_shipping: needShipping ? ship : null,
      p_method: "manual",
    });
    setBusy(false);

    if (err || !data) {
      const m = err?.message ?? "";
      if (m.includes("out of stock")) return setError(t("errStock"));
      if (m.includes("already enrolled")) return setError(t("errAlready"));
      if (m.includes("shipping required")) return setError(t("errShipping"));
      if (m.includes("rate_limited")) return setError(t("errRate"));
      if (m.includes("product unavailable")) return setError(t("errUnavailable"));
      return setError(t("errGeneric"));
    }
    clear();
    router.push({ pathname: "/orders", query: { new: String((data as { number: number }).number) } });
  }

  const field =
    "w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2 text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        {needShipping && (
          <fieldset className="space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5">
            <legend className="px-1 font-bold text-navy-900">{t("shippingTitle")}</legend>
            {(
              [
                ["name", t("name"), "name"],
                ["phone", t("phone"), "tel"],
                ["address", t("address"), "street-address"],
                ["city", t("city"), "address-level2"],
                ["country", t("country"), "country-name"],
              ] as const
            ).map(([k, label, ac]) => (
              <label key={k} className="block text-sm font-semibold">
                {label}
                <input
                  value={ship[k]}
                  onChange={(e) => setShip((p) => ({ ...p, [k]: e.target.value }))}
                  autoComplete={ac}
                  required
                  maxLength={k === "address" ? 300 : 120}
                  className={`${field} mt-1`}
                />
              </label>
            ))}
          </fieldset>
        )}

        <div className="rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5">
          <h2 className="mb-2 font-bold text-navy-900">{t("paymentTitle")}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-800">{instructions}</p>
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl bg-navy-900 p-5 text-white">
        <h2 className="font-bold">{t("summary")}</h2>
        <ul className="space-y-2 text-sm">
          {lines.map((l) => {
            const p = products[l.id];
            if (!p) return null;
            const q = lineQty(p, l.qty);
            return (
              <li key={l.id} className="flex justify-between gap-3">
                <span>
                  {locale === "en" ? p.title_en : p.title_ar} × {q}
                </span>
                <span>{formatPrice(p.price_cents * q)}</span>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-between border-t border-white/20 pt-3 text-lg font-extrabold text-gold-400">
          <span>{t("total")}</span>
          <span>{formatPrice(total)}</span>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
        >
          {busy ? t("placing") : t("placeOrder")}
        </button>
      </aside>
    </form>
  );
}
