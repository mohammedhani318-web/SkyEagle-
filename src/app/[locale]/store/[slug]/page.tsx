import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import AddToCartButton from "@/components/store/AddToCartButton";
import { getServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { paragraphs, pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await getServerClient();
  if (!supabase) notFound();

  // المنتج غير المنشور لا يظهر إلا لمن اشتراه أو للطاقم (تفرضه سياسات RLS)
  const { data: p } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (!p) notFound();

  const t = await getTranslations("store");
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let courseSlug: string | null = null;
  let enrolled = false;
  if (p.course_id) {
    const { data: course } = await supabase.from("courses").select("slug").eq("id", p.course_id).maybeSingle();
    courseSlug = course?.slug ?? null;
    if (user) {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id)
        .eq("course_id", p.course_id)
        .maybeSingle();
      enrolled = !!enr;
    }
  }

  const soldOut = p.stock !== null && p.stock <= 0;
  const canBuy = p.published && !soldOut && !enrolled;

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1.2fr]">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20">
            {typeof p.image_url === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-7xl" aria-hidden="true">
                {p.kind === "book" ? "📘" : p.kind === "file" ? "📄" : p.kind === "course" ? "🎓" : "🛍"}
              </span>
            )}
          </div>
          <div className="space-y-4">
            <Link href="/store" className="inline-block text-sm font-semibold text-gold-400 hover:text-gold-500">
              <span className="inline-block rtl:rotate-180">←</span> {t("back")}
            </Link>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/10 px-3 py-1">{t(`kindOne.${p.kind as "book" | "file" | "merch" | "course"}`)}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{p.is_digital ? t("digital") : t("physical")}</span>
              {p.stock !== null && !soldOut && (
                <span className="rounded-full bg-white/10 px-3 py-1">{t("stockLeft", { count: p.stock })}</span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{pick(p, "title", locale)}</h1>
            <p className="text-3xl font-extrabold text-gold-400">
              {p.price_cents === 0 ? t("free") : formatPrice(p.price_cents)}
            </p>
            {enrolled && courseSlug ? (
              <div className="space-y-3">
                <p className="text-sm text-white/80">{t("alreadyEnrolled")}</p>
                <Link
                  href={`/courses/${courseSlug}/learn`}
                  className="inline-block rounded-full bg-gold-500 px-6 py-3 font-bold text-navy-950 hover:bg-gold-400"
                >
                  {t("openCourse")}
                </Link>
              </div>
            ) : (
              <AddToCartButton productId={p.id} digital={p.is_digital} disabled={!canBuy} />
            )}
            <p className="text-sm text-white/70">
              {p.kind === "course" ? t("courseNote") : p.is_digital ? t("digitalNote") : t("physicalNote")}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-lg leading-loose text-navy-900">
          {paragraphs(pick(p, "description", locale)).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>
    </>
  );
}
