import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import ArticleCard from "@/components/ArticleCard";
import { getAllArticles } from "@/lib/content";
import { localize } from "@/lib/types";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await getServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = data.user;
  if (!supabase || !user) return redirect({ href: "/login", locale });

  const { data: rows } = await supabase
    .from("favorites")
    .select("article_slug, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const order = (rows ?? []).map((r) => r.article_slug as string);
  const all = await getAllArticles();
  const items = order
    .map((slug) => all.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map((a) => localize(a, locale));

  const t = await getTranslations("favorites");

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-extrabold sm:text-4xl">★ {t("title")}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
