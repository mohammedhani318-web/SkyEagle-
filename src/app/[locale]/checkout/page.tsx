import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import CheckoutForm from "@/components/store/CheckoutForm";
import { getServerClient } from "@/lib/supabase/server";
import { pick } from "@/lib/db-text";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await getServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !data.user) return redirect({ href: "/login", locale });

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value_ar, value_en")
    .eq("key", "payment_instructions")
    .maybeSingle();

  const t = await getTranslations("checkout");

  return (
    <>
      <section className="hero-bg text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <CheckoutForm instructions={setting ? pick(setting, "value", locale) : ""} />
      </section>
    </>
  );
}
