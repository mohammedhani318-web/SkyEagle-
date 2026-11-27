import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "./Logo";
import { SECTION_KEYS } from "./sections";

export default function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const brand = useTranslations("brand");
  const sections = useTranslations("sections.items");
  const year = new Date().getFullYear();

  return (
    <footer className="print:hidden bg-navy-950 text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <div className="text-white">
            <Logo tagline={brand("tagline")} />
          </div>
          <p className="max-w-sm text-sm leading-relaxed">{t("about")}</p>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-gold-400">{t("sections")}</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {SECTION_KEYS.map((key) => (
              <li key={key}>
                <Link href={`/${key}`} className="hover:text-gold-400">
                  {sections(`${key}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-gold-400">{t("platform")}</h3>
          <ul className="grid gap-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-gold-400">
                {nav("login")}
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-gold-400">
                {nav("signup")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-gold-400">
                {nav("contact")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {year} SkyEagle. {t("rights")}
      </div>
    </footer>
  );
}
