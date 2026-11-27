import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllArticles } from "@/lib/content";

const STATIC = ["", "/aviation", "/space", "/maintenance", "/library", "/courses", "/jobs", "/community", "/store"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const articles = await getAllArticles();
  const paths = [...STATIC, ...articles.map((a) => `/articles/${a.slug}`)];
  return paths.flatMap((p) =>
    routing.locales.map((l) => ({ url: `${base}/${l}${p}`, changeFrequency: "weekly" as const })),
  );
}
