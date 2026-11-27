import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import ModerationButtons from "@/components/community/ModerationButtons";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminComments({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });

  const [{ data: threads }, { data: comments }] = await Promise.all([
    ctx.supabase
      .from("community_threads")
      .select("id, title, author_name, hidden, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    ctx.supabase
      .from("community_comments")
      .select("id, thread_id, body, author_name, hidden, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const t = await getTranslations("adminP5.comments");
  const c = await getTranslations("community");

  const box = "rounded-xl border border-navy-900/10 bg-white p-4";

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy-900">{t("threads")}</h2>
        {(threads ?? []).length === 0 && <p className="text-sm text-navy-700">{t("empty")}</p>}
        {(threads ?? []).map((th) => (
          <div key={th.id} className={`${box} flex flex-wrap items-center justify-between gap-3`}>
            <div className="min-w-0">
              <Link href={`/community/${th.id}`} className="font-semibold text-navy-900 hover:text-gold-600">
                {th.title}
              </Link>
              <div className="text-xs text-navy-700/80">
                {th.author_name}
                {th.hidden && ` · ${c("hidden")}`}
              </div>
            </div>
            <ModerationButtons table="community_threads" id={th.id} hidden={th.hidden} canHide canDelete />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-navy-900">{t("comments")}</h2>
        {(comments ?? []).length === 0 && <p className="text-sm text-navy-700">{t("empty")}</p>}
        {(comments ?? []).map((cm) => (
          <div key={cm.id} className={`${box} space-y-2`}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-navy-700/80">
              <Link href={`/community/${cm.thread_id}`} className="font-semibold text-navy-900 hover:text-gold-600">
                {cm.author_name}
                {cm.hidden && ` · ${c("hidden")}`}
              </Link>
              <ModerationButtons table="community_comments" id={cm.id} hidden={cm.hidden} canHide canDelete />
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-navy-900">{cm.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
