import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import CommentForm from "@/components/community/CommentForm";
import ModerationButtons from "@/components/community/ModerationButtons";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata(): Promise<Metadata> {
  // محتوى يكتبه المستخدمون: لا نفهرسه في محركات البحث
  return { robots: { index: false, follow: true } };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!UUID_RE.test(id)) notFound();
  setRequestLocale(locale);

  const { supabase, user, isStaff } = await getViewer();
  if (!supabase) notFound();

  const { data: thread } = await supabase
    .from("community_threads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!thread) notFound();

  const { data: comments } = await supabase
    .from("community_comments")
    .select("*")
    .eq("thread_id", id)
    .order("created_at");

  const t = await getTranslations("community");
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
  const mine = (uid: string) => user?.id === uid;

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <Link href="/community" className="inline-block text-sm font-semibold text-gold-600 hover:text-gold-500">
        <span className="inline-block rtl:rotate-180">←</span> {t("back")}
      </Link>

      <article className="space-y-3 rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-navy-900">{thread.title}</h1>
          {thread.hidden && (
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {t("hidden")}
            </span>
          )}
        </div>
        <p className="text-xs text-navy-700/80">
          {t("by")} {thread.author_name} · {fmt.format(new Date(thread.created_at))}
        </p>
        {/* نص عادي: React يهرّب المحتوى، ولا نستخدم HTML خام أبدًا */}
        <p className="whitespace-pre-wrap break-words leading-loose text-navy-900">{thread.body}</p>
        <ModerationButtons
          table="community_threads"
          id={thread.id}
          hidden={thread.hidden}
          canHide={isStaff}
          canDelete={isStaff || mine(thread.user_id)}
          afterDelete="/community"
        />
      </article>

      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-navy-900">{t("replies", { count: comments?.length ?? 0 })}</h2>
        {(comments ?? []).length === 0 ? (
          <p className="text-sm text-navy-700">{t("noComments")}</p>
        ) : (
          <ul className="space-y-3">
            {(comments ?? []).map((c) => (
              <li key={c.id} className="space-y-2 rounded-xl border border-navy-900/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-navy-700/80">
                  <span>
                    <strong className="text-navy-900">{c.author_name}</strong> · {fmt.format(new Date(c.created_at))}
                    {c.hidden && ` · ${t("hidden")}`}
                  </span>
                  <ModerationButtons
                    table="community_comments"
                    id={c.id}
                    hidden={c.hidden}
                    canHide={isStaff}
                    canDelete={isStaff || mine(c.user_id)}
                  />
                </div>
                <p className="whitespace-pre-wrap break-words leading-relaxed text-navy-900">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {user ? (
        <CommentForm threadId={thread.id} userId={user.id} />
      ) : (
        <Link
          href="/login"
          className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
        >
          {t("loginToPost")}
        </Link>
      )}
    </section>
  );
}
