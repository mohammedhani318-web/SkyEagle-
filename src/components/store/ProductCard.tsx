import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  kind: "book" | "file" | "merch" | "course";
  title: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  is_digital: boolean;
  stock: number | null;
};

const ICONS: Record<ProductCardData["kind"], string> = {
  book: "📘",
  file: "📄",
  merch: "🛍",
  course: "🎓",
};

export default function ProductCard({ product: p }: { product: ProductCardData }) {
  const t = useTranslations("store");
  const soldOut = p.stock !== null && p.stock <= 0;

  return (
    <Link
      href={`/store/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-navy-900/5">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="text-5xl" aria-hidden="true">
            {ICONS[p.kind]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-navy-900 px-3 py-1 text-white">{t(`kindOne.${p.kind}`)}</span>
          <span className="rounded-full bg-sky-accent/15 px-3 py-1 text-navy-700">
            {p.is_digital ? t("digital") : t("physical")}
          </span>
          {soldOut && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">{t("outOfStock")}</span>
          )}
        </div>
        <h2 className="mb-1 text-lg font-bold text-navy-900">{p.title}</h2>
        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-navy-700">{p.description}</p>
        <div className="text-lg font-extrabold text-gold-600">
          {p.price_cents === 0 ? t("free") : formatPrice(p.price_cents)}
        </div>
      </div>
    </Link>
  );
}
