import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import JobsAdmin, { type JobRow } from "@/components/admin/JobsAdmin";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminJobs({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });

  const { data } = await ctx.supabase.from("jobs").select("*").order("created_at", { ascending: false });

  return <JobsAdmin jobs={(data ?? []) as JobRow[]} canDelete={ctx.role === "admin"} locale={locale} />;
}
