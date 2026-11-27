"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "./CartProvider";

export default function AddToCartButton({
  productId,
  digital,
  disabled,
}: {
  productId: string;
  digital: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("store");
  const { lines, add } = useCart();
  const inCart = lines.some((l) => l.id === productId);

  if (disabled) {
    return (
      <span className="inline-block rounded-full bg-slate-200 px-6 py-3 font-bold text-slate-600">
        {t("outOfStock")}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => add(productId, { single: digital })}
        className="rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-400"
      >
        {inCart ? `✓ ${t("inCart")}` : t("addToCart")}
      </button>
      {inCart && (
        <Link href="/cart" className="text-sm font-bold text-gold-400 hover:text-gold-500">
          {t("viewCart")} <span className="inline-block rtl:rotate-180">→</span>
        </Link>
      )}
    </div>
  );
}
