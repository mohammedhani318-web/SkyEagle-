"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { id: string; qty: number };

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (id: string, opts?: { single?: boolean }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
};

const KEY = "skyeagle-cart-v1";
const MAX_QTY = 20;
const CartContext = createContext<CartContextValue | null>(null);

function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CartLine[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const { id, qty } = x as Record<string, unknown>;
    if (typeof id !== "string" || seen.has(id)) continue;
    const q = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(qty)) || 1));
    seen.add(id);
    out.push({ id, qty: q });
  }
  return out.slice(0, 50);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // التحميل من المتصفح بعد أول رسم لتفادي اختلاف الـ hydration
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(sanitize(JSON.parse(raw)));
    } catch {
      /* التخزين غير متاح */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* تجاهل */
    }
  }, [lines, ready]);

  const add = useCallback((id: string, opts?: { single?: boolean }) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (!found) return [...prev, { id, qty: 1 }].slice(0, 50);
      if (opts?.single) return prev;
      return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, Math.max(1, Math.floor(qty) || 1)) } : l)),
    );
  }, []);
  const remove = useCallback((id: string) => setLines((p) => p.filter((l) => l.id !== id)), []);
  const removeMany = useCallback(
    (ids: string[]) => setLines((p) => p.filter((l) => !ids.includes(l.id))),
    [],
  );
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add,
      setQty,
      remove,
      removeMany,
      clear,
    }),
    [lines, ready, add, setQty, remove, removeMany, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
