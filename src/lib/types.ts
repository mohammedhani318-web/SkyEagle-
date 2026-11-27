export type Category = "aviation" | "space" | "maintenance";
export type Kind = "article" | "reference" | "book";
export type Access = "free" | "paid";
export type L10n<T> = { ar: T; en: T };

export type Article = {
  slug: string;
  category: Category;
  kind: Kind;
  access: Access;
  readMinutes: number;
  publishedAt: string; // ISO date
  title: L10n<string>;
  excerpt: L10n<string>;
  body: L10n<string[]>; // paragraphs
};

export type LocalizedArticle = Omit<Article, "title" | "excerpt" | "body"> & {
  title: string;
  excerpt: string;
  body: string[];
};

export function localize(a: Article, locale: string): LocalizedArticle {
  const l = locale === "en" ? "en" : "ar";
  return {
    ...a,
    title: a.title[l],
    excerpt: a.excerpt[l],
    body: a.body[l],
  };
}
