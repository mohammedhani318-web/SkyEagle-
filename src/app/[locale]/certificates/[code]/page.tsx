import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import PrintButton from "@/components/learn/PrintButton";
import EagleLogo from "@/components/Logo";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Verified = {
  holder_name: string;
  issued_at: string;
  title_ar: string;
  title_en: string;
};

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!/^[A-Za-z0-9]{12}$/.test(code)) notFound();
  setRequestLocale(locale);

  const supabase = await getServerClient();
  if (!supabase) notFound();

  const { data } = await supabase.rpc("verify_certificate", { p_code: code });
  const cert = data as Verified | null;
  if (!cert) notFound();

  const t = await getTranslations("certificate");
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(cert.issued_at));

  return (
    <section className="bg-slate-100 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl rounded-2xl border-8 border-double border-gold-500 bg-white p-8 text-center shadow-xl sm:p-14 print:max-w-none print:rounded-none print:shadow-none">
        <div className="mb-6 flex justify-center text-navy-900">
          <EagleLogo className="h-14 w-14" tagline={t("brand")} />
        </div>
        <h1 className="mb-8 text-3xl font-extrabold text-navy-900 sm:text-4xl">{t("heading")}</h1>
        <p className="text-navy-700">{t("awardedTo")}</p>
        <p className="my-4 text-3xl font-extrabold text-gold-600 sm:text-4xl">{cert.holder_name}</p>
        <p className="text-navy-700">{t("forCompleting")}</p>
        <p className="my-4 text-2xl font-bold text-navy-900">
          {locale === "en" ? cert.title_en : cert.title_ar}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm text-navy-700">
          <span>
            {t("issuedOn")}: <strong>{date}</strong>
          </span>
          <span>
            {t("code")}:{" "}
            <strong dir="ltr" className="font-mono">
              {code.toUpperCase()}
            </strong>
          </span>
        </div>
        <p className="mt-6 text-xs text-emerald-700">✓ {t("verified")}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 print:hidden">
        <PrintButton />
        <Link href="/" className="text-sm font-semibold text-navy-700 hover:text-gold-600">
          {t("back")}
        </Link>
      </div>
    </section>
  );
}
