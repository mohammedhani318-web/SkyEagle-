import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import ProfileForm from "@/components/ProfileForm";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const t = await getTranslations("profile");

  // سجل الدورات والشهادات (RLS يقصر القراءة على صاحب الحساب)
  const [{ data: enrollRows }, { data: certRows }] = await Promise.all([
    supabase.from("enrollments").select("course_id").eq("user_id", user.id),
    supabase
      .from("certificates")
      .select("code, course_id, issued_at")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false }),
  ]);
  const courseIds = Array.from(
    new Set([
      ...(enrollRows ?? []).map((r) => r.course_id as string),
      ...(certRows ?? []).map((r) => r.course_id as string),
    ]),
  );
  const { data: courseRows } = courseIds.length
    ? await supabase
        .from("courses")
        .select("id, slug, title_ar, title_en")
        .in("id", courseIds)
    : { data: [] };
  const courseById = new Map((courseRows ?? []).map((c) => [c.id as string, c]));
  const myCourses = (enrollRows ?? [])
    .map((r) => courseById.get(r.course_id as string))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const myCerts = (certRows ?? [])
    .map((r) => ({ code: r.code as string, course: courseById.get(r.course_id as string) }))
    .filter((r) => r.course);

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          initial={{
            displayName: profile?.display_name ?? "",
            bio: profile?.bio ?? "",
            avatarUrl: profile?.avatar_url ?? null,
          }}
        />
        <Link
          href="/favorites"
          className="mt-8 inline-block text-sm font-bold text-gold-600 hover:text-gold-500"
        >
          ★ {t("myFavorites")}
        </Link>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-extrabold text-navy-900">🎓 {t("myCourses")}</h2>
            {myCourses.length === 0 ? (
              <p className="text-sm text-navy-700">
                {t("noCourses")}{" "}
                <Link href="/courses" className="font-bold text-gold-600 hover:text-gold-500">
                  {t("browse")}
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {myCourses.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/courses/${c.slug}/learn`}
                      className="block rounded-lg border border-navy-900/10 bg-white px-4 py-2.5 text-sm font-semibold hover:border-gold-500"
                    >
                      {locale === "en" ? c.title_en : c.title_ar}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="mb-3 text-lg font-extrabold text-navy-900">🏅 {t("myCertificates")}</h2>
            {myCerts.length === 0 ? (
              <p className="text-sm text-navy-700">{t("noCertificates")}</p>
            ) : (
              <ul className="space-y-2">
                {myCerts.map((c) => (
                  <li key={c.code}>
                    <Link
                      href={`/certificates/${c.code}`}
                      className="block rounded-lg border border-navy-900/10 bg-white px-4 py-2.5 text-sm font-semibold hover:border-gold-500"
                    >
                      {locale === "en" ? c.course!.title_en : c.course!.title_ar}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
