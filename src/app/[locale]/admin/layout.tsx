import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });

  const t = await getTranslations("admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-navy-900">{t("title")}</h1>
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminNav role={ctx.role} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
