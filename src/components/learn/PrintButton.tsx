"use client";

import { useTranslations } from "next-intl";

export default function PrintButton() {
  const t = useTranslations("certificate");
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-navy-900 px-6 py-2.5 font-bold text-white hover:bg-navy-700 print:hidden"
    >
      {t("print")}
    </button>
  );
}
