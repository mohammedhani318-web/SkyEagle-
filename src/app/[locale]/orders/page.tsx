import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import CancelOrderButton from "@/components/store/CancelOrderButton";
import { getServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

type Status = "pending" | "paid" | "cancelled" | "refunded";

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await getServerClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userData.user;
  if (!supabase || !user) return redirect({ href: "/login", locale });

  const { data: orders } = await supabase
    .from("orders")
    .select("id, number, status, total_cents, created_at, order_items(id, product_id, title_ar, title_en, unit_price_cents, quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const list = orders ?? [];

  const productIds = Array.from(
    new Set(list.flatMap((o) => (o.order_items ?? []).map((i) => i.product_id as string))),
  );
  const { data: prods } = productIds.length
    ? await supabase.from("products").select("id, is_digital, file_path, course_id").in("id", productIds)
    : { data: [] };
  const prodById = new Map((prods ?? []).map((p) => [p.id as string, p]));

  const courseIds = Array.from(new Set((prods ?? []).map((p) => p.course_id).filter(Boolean) as string[]));
  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("id, slug").in("id", courseIds)
    : { data: [] };
  const courseSlug = new Map((courses ?? []).map((c) => [c.id as string, c.slug as string]));

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value_ar, value_en")
    .eq("key", "payment_instructions")
    .maybeSingle();

  const t = await getTranslations("orders");
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeZone: "UTC" });
  const newNumber = sp.new && /^\d{1,12}$/.test(sp.new) ? sp.new : null;

  const badge: Record<Status, string> = {
    pending: "bg-amber-100 text-amber-900",
    paid: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-slate-200 text-slate-700",
    refunded: "bg-slate-200 text-slate-700",
  };

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        {newNumber && (
          <p role="status" className="rounded-lg bg-emerald-50 p-4 font-semibold text-emerald-800">
            {t("newOrder", { n: newNumber })}
          </p>
        )}

        {list.length === 0 ? (
          <div className="space-y-4 rounded-xl bg-slate-50 p-8 text-center">
            <p className="text-navy-700">{t("empty")}</p>
            <Link href="/store" className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400">
              {t("browse")}
            </Link>
          </div>
        ) : (
          list.map((o) => {
            const status = o.status as Status;
            return (
              <article key={o.id} className="space-y-4 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-navy-900">{t("number", { n: o.number })}</h2>
                    <p className="text-xs text-navy-700/80">{fmt.format(new Date(o.created_at))}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge[status]}`}>
                    {t(`status.${status}`)}
                  </span>
                </div>

                <ul className="divide-y divide-navy-900/10">
                  {(o.order_items ?? []).map((i) => {
                    const p = prodById.get(i.product_id as string);
                    const slug = p?.course_id ? courseSlug.get(p.course_id as string) : undefined;
                    return (
                      <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                        <span className="font-semibold text-navy-900">
                          {pick(i, "title", locale)} × {i.quantity}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-navy-700">{formatPrice(i.unit_price_cents * i.quantity)}</span>
                          {status === "paid" && p?.is_digital && p.file_path && (
                            <a
                              href={`/api/download/${i.product_id}`}
                              className="rounded-md bg-navy-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-700"
                            >
                              ⬇ {t("download")}
                            </a>
                          )}
                          {status === "paid" && slug && (
                            <Link
                              href={`/courses/${slug}/learn`}
                              className="rounded-md bg-gold-500 px-3 py-1.5 text-xs font-bold text-navy-950 hover:bg-gold-400"
                            >
                              {t("openCourse")}
                            </Link>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-navy-700">{t(`statusHint.${status}`)}</p>
                  <p className="font-extrabold text-gold-600">
                    {t("total")}: {formatPrice(o.total_cents)}
                  </p>
                </div>

                {status === "pending" && (
                  <div className="space-y-3 rounded-xl bg-gold-500/10 p-4">
                    {setting && (
                      <div>
                        <div className="mb-1 text-xs font-bold text-navy-900">{t("paymentInfo")}</div>
                        <p className="whitespace-pre-wrap text-sm text-navy-800">{pick(setting, "value", locale)}</p>
                      </div>
                    )}
                    <CancelOrderButton orderId={o.id} />
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
