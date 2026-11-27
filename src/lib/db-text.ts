/** يختار الحقل بحسب اللغة من صف قاعدة البيانات: pick(row, "title", "ar") → row.title_ar */
export function pick(row: Record<string, unknown>, field: string, locale: string): string {
  const l = locale === "en" ? "en" : "ar";
  const v = row[`${field}_${l}`];
  return typeof v === "string" ? v : "";
}

export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? "").split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
}

/** يحوّل رابط الفيديو إلى شكل آمن للعرض (https فقط) */
export type VideoEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "file"; src: string }
  | null;

export function parseVideo(url: string | null | undefined): VideoEmbed {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1);
  else if (host === "youtube.com" || host === "m.youtube.com") {
    id = u.searchParams.get("v") ?? (u.pathname.startsWith("/embed/") ? u.pathname.slice(7) : null);
  }
  if (id && /^[\w-]{6,20}$/.test(id)) {
    return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (/\.(mp4|webm)$/i.test(u.pathname)) return { kind: "file", src: u.toString() };
  return null;
}
