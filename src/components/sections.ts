export const SECTION_KEYS = [
  "aviation",
  "space",
  "maintenance",
  "library",
  "jobs",
  "courses",
  "community",
  "store",
  "about",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_ICONS: Record<SectionKey, string> = {
  aviation: "✈",
  space: "🚀",
  maintenance: "🔧",
  library: "📚",
  jobs: "💼",
  courses: "🎓",
  community: "💬",
  store: "🛒",
  about: "🦅",
};

export function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}
