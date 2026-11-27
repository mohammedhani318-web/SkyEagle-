"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

type Item = { key: string; href: string; adminOnly?: boolean; soon?: boolean };

const ITEMS: Item[] = [
  { key: "overview", href: "/admin" },
  { key: "articles", href: "/admin/articles" },
  { key: "media", href: "/admin/media" },
  { key: "users", href: "/admin/users", adminOnly: true },
  { key: "courses", href: "/admin/courses" },
  { key: "jobs", href: "/admin/jobs" },
  { key: "comments", href: "/admin/comments" },
  { key: "products", href: "/admin/products" },
  { key: "orders", href: "/admin/orders", adminOnly: true },
];

export default function AdminNav({ role }: { role: "admin" | "editor" }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.filter((i) => !i.adminOnly || role === "admin").map((i) => (
        <Link
          key={i.key}
          href={i.href}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isActive(i.href)
              ? "bg-navy-900 text-white"
              : "text-navy-800 hover:bg-navy-900/5"
          } ${i.soon ? "opacity-60" : ""}`}
        >
          {t(i.key)}
        </Link>
      ))}
      <Link
        href="/"
        className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-navy-700 hover:bg-navy-900/5 lg:mt-4"
      >
        ← {t("backToSite")}
      </Link>
    </nav>
  );
}
