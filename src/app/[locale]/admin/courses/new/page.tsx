import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import NewCourseEditor from "@/components/admin/NewCourseEditor";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewCourse({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });

  const t = await getTranslations("adminP5.courses");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-navy-900">{t("new")}</h2>
      <NewCourseEditor />
    </div>
  );
}
