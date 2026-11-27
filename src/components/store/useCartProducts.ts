"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase/browser";

export type CartProduct = {
  id: string;
  slug: string;
  kind: "book" | "file" | "merch" | "course";
  title_ar: string;
  title_en: string;
  price_cents: number;
  is_digital: boolean;
  stock: number | null;
};

/** يجلب بيانات منتجات السلة الحالية من القاعدة (للعرض فقط؛ السعر النهائي يحسبه الخادم) */
export function useCartProducts() {
  const { lines, ready, removeMany } = useCart();
  const [products, setProducts] = useState<Record<string, CartProduct>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const key = lines.map((l) => l.id).join(",");

  useEffect(() => {
    if (!ready || !key) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    const ids = key.split(",");

    supabase
      .from("products")
      .select("id, slug, kind, title_ar, title_en, price_cents, is_digital, stock")
      .in("id", ids)
      .eq("published", true)
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, CartProduct> = {};
        (data ?? []).forEach((p) => {
          map[p.id] = p as CartProduct;
        });
        setProducts(map);
        const missing = ids.filter((id) => !map[id]);
        if (missing.length) {
          removeMany(missing);
          setRemoved(true);
        }
        setLoadedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, key, removeMany]);

  const loading = !ready || (key !== "" && isSupabaseConfigured && loadedKey !== key);
  return { lines, products, loading, removed };
}

export function lineQty(product: CartProduct | undefined, qty: number): number {
  return product?.is_digital ? 1 : qty;
}
