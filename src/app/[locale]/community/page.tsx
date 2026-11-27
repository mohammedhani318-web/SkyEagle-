import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import NewThreadForm from "@/components/community/NewThreadForm";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("community");
  const sec = await getTranslations("sections.items");
  const auth = await getTranslations("auth");
  const { supabase, user } = await getViewer();

  const { data } = supabase
    ? await supabase
        .from("community_threads")
        .select("id, title, author_name, created_at, hidden")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: null };
  const threads = data ?? [];

  const { data: cs } =
    supabase && threads.length
      ? await supabase
          .from("community_comments")
          .select("thread_id")
          .in("thread_id", threads.map((x) => x.id))
      : { data: [] };
  const counts = new Map<string, number>();
  (cs ?? []).forEach((c) => counts.set(c.thread_id, (counts.get(c.thread_id) ?? 0) + 1));

  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-3xl ring-1 ring-white/20">
            💬
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{sec("community.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{sec("community.desc")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
        {!supabase ? (
          <p className="rounded-xl bg-amber-50 p-6 text-center text-amber-900">{auth("notConfigured")}</p>
        ) : (
          <>
            {user ? (
              <NewThreadForm userId={user.id} />
            ) : (
              <Link
                href="/login"
                className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
              >
                {t("loginToPost")}
              </Link>
            )}

            {threads.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-8 text-center text-navy-700">{t("empty")}</p>
            ) : (
              <ul className="space-y-3">
                {threads.map((th) => (
                  <li key={th.id}>
                    <Link
                      href={`/community/${th.id}`}
                      className="block rounded-xl border border-navy-900/10 bg-white p-4 shadow-sm transition hover:border-gold-500"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-bold text-navy-900">{th.title}</h2>
                        {th.hidden && (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {t("hidden")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-navy-700/80">
                        {t("by")} {th.author_name} · {fmt.format(new Date(th.created_at))} ·{" "}
                        {t("replies", { count: counts.get(th.id) ?? 0 })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}
