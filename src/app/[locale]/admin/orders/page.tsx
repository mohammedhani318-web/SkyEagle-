import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import OrderActions from "@/components/admin/OrderActions";
import PaymentSettings from "@/components/admin/PaymentSettings";
import { getStaffContext } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

type Status = "pending" | "paid" | "cancelled" | "refunded";

export default async function AdminOrders({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });
  if (ctx.role !== "admin") return redirect({ href: "/admin", locale });
  const { supabase } = ctx;

  const [{ data: orders }, { data: setting }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, number, user_id, status, total_cents, payment_ref, shipping, created_at, order_items(id, title_ar, title_en, unit_price_cents, quantity)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("site_settings").select("value_ar, value_en").eq("key", "payment_instructions").maybeSingle(),
  ]);
  const list = orders ?? [];

  const userIds = Array.from(new Set(list.map((o) => o.user_id).filter(Boolean) as string[]));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name, email").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const t = await getTranslations("adminP6.orders");
  const st = await getTranslations("orders.status");
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const badge: Record<Status, string> = {
    pending: "bg-amber-100 text-amber-900",
    paid: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-slate-200 text-slate-700",
    refunded: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="space-y-8">
      <PaymentSettings ar={setting?.value_ar ?? ""} en={setting?.value_en ?? ""} />

      <h2 className="text-xl font-bold text-navy-900">{t("title")}</h2>
      {list.length === 0 && <p className="text-sm text-navy-700">{t("empty")}</p>}

      <div className="space-y-4">
        {list.map((o) => {
          const status = o.status as Status;
          const u = o.user_id ? profileById.get(o.user_id) : undefined;
          const ship = o.shipping as Record<string, string> | null;
          return (
            <article key={o.id} className="space-y-3 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-navy-900">#{o.number}</h3>
                  <p className="text-xs text-navy-700/80">{fmt.format(new Date(o.created_at))}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge[status]}`}>{st(status)}</span>
              </div>

              <p className="text-sm">
                <span className="font-semibold">{t("customer")}:</span> {u?.display_name || "—"}{" "}
                <span dir="ltr" className="text-navy-700/80">
                  {u?.email ?? ""}
                </span>
              </p>

              <ul className="divide-y divide-navy-900/10 text-sm">
                {(o.order_items ?? []).map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 py-1.5">
                    <span>
                      {pick(i, "title", locale)} × {i.quantity}
                    </span>
                    <span>{formatPrice(i.unit_price_cents * i.quantity)}</span>
                  </li>
                ))}
              </ul>

              {ship && (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-navy-800">
                  <span className="font-semibold">{t("shipping")}:</span> {ship.name} · {ship.phone} · {ship.address},{" "}
                  {ship.city}, {ship.country}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <OrderActions orderId={o.id} status={status} />
                <div className="text-end">
                  <div className="font-extrabold text-gold-600">{formatPrice(o.total_cents)}</div>
                  {o.payment_ref && (
                    <div dir="ltr" className="text-xs text-navy-700/80">
                      {o.payment_ref}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
