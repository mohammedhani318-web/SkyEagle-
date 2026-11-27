import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/store/ProductCard";
import { getServerClient } from "@/lib/supabase/server";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

const KINDS = ["book", "file", "merch", "course"] as const;

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { locale } = await params;
  const { kind } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("store");
  const sec = await getTranslations("sections.items");
  const auth = await getTranslations("auth");
  const activeKind = KINDS.find((k) => k === kind);

  const supabase = await getServerClient();
  let rows: Record<string, unknown>[] = [];
  if (supabase) {
    let q = supabase.from("products").select("*").eq("published", true).order("created_at", { ascending: false });
    if (activeKind) q = q.eq("kind", activeKind);
    const { data } = await q;
    rows = data ?? [];
  }

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 ring-1 ${
      active
        ? "bg-navy-900 text-white ring-navy-900"
        : "bg-white text-navy-900 ring-navy-900/20 hover:ring-gold-500"
    }`;

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-3xl ring-1 ring-white/20">
            🛒
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{sec("store.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{sec("store.desc")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <nav className="mb-8 flex flex-wrap gap-2 text-sm font-semibold">
          <Link href="/store" className={chip(!activeKind)}>
            {t("all")}
          </Link>
          {KINDS.map((k) => (
            <Link key={k} href={{ pathname: "/store", query: { kind: k } }} className={chip(activeKind === k)}>
              {t(`kinds.${k}`)}
            </Link>
          ))}
        </nav>

        {!supabase ? (
          <p className="rounded-xl bg-amber-50 p-6 text-center text-amber-900">{auth("notConfigured")}</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">{t("empty")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((r) => (
              <ProductCard
                key={String(r.id)}
                product={{
                  slug: String(r.slug),
                  kind: r.kind as "book" | "file" | "merch" | "course",
                  title: pick(r, "title", locale),
                  description: pick(r, "description", locale),
                  price_cents: Number(r.price_cents),
                  image_url: typeof r.image_url === "string" ? r.image_url : null,
                  is_digital: Boolean(r.is_digital),
                  stock: typeof r.stock === "number" ? r.stock : null,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
