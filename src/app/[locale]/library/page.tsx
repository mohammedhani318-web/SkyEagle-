import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import CategoryPage from "@/components/CategoryPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { locale } = await params;
  const { kind } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  return <CategoryPage locale={locale} section="library" kind={kind} />;
}
