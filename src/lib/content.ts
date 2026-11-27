import { SEED_ARTICLES } from "@/data/articles";
import { getSupabase } from "./supabase";
import type { Article, Category, Kind } from "./types";

type Row = {
  slug: string;
  category: Category;
  kind: Kind;
  access: "free" | "paid";
  read_minutes: number;
  published_at: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  body_ar: string;
  body_en: string;
};

function fromRow(r: Row): Article {
  return {
    slug: r.slug,
    category: r.category,
    kind: r.kind,
    access: r.access,
    readMinutes: r.read_minutes,
    publishedAt: r.published_at,
    title: { ar: r.title_ar, en: r.title_en },
    excerpt: { ar: r.excerpt_ar, en: r.excerpt_en },
    body: {
      ar: r.body_ar.split(/\n{2,}/).filter(Boolean),
      en: r.body_en.split(/\n{2,}/).filter(Boolean),
    },
  };
}

export async function getAllArticles(): Promise<Article[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (!error && data && data.length > 0) return (data as Row[]).map(fromRow);
    if (error) console.error("Supabase articles error:", error.message);
  }
  return [...SEED_ARTICLES].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export async function getArticlesByCategory(category: Category) {
  return (await getAllArticles()).filter((a) => a.category === category);
}

export async function getArticle(slug: string) {
  return (await getAllArticles()).find((a) => a.slug === slug) ?? null;
}

/** تطبيع النص العربي/الإنجليزي لمطابقة أفضل في البحث */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "") // التشكيل والتطويل
    .replace(/[آأإ]/g, "ا") // أ إ آ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchArticles(query: string): Promise<Article[]> {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [];

  const scored = (await getAllArticles())
    .map((a) => {
      const title = normalize(`${a.title.ar} ${a.title.en}`);
      const excerpt = normalize(`${a.excerpt.ar} ${a.excerpt.en}`);
      const body = normalize([...a.body.ar, ...a.body.en].join(" "));
      let score = 0;
      for (const t of terms) {
        const inTitle = title.includes(t);
        const inExcerpt = excerpt.includes(t);
        const inBody = body.includes(t);
        if (!inTitle && !inExcerpt && !inBody) return { a, score: 0 }; // AND
        score += (inTitle ? 5 : 0) + (inExcerpt ? 2 : 0) + (inBody ? 1 : 0);
      }
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);

  return scored.map((x) => x.a);
}
