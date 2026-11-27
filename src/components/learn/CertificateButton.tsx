"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export default function CertificateButton({ courseId }: { courseId: string }) {
  const t = useTranslations("courses.learn");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function issue() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setError(false);
    const { data, error: err } = await supabase.rpc("issue_certificate", { p_course: courseId });
    setBusy(false);
    if (err || !data) return setError(true);
    router.push(`/certificates/${data}`);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={issue}
        disabled={busy}
        className="rounded-full bg-gold-500 px-6 py-2.5 font-bold text-navy-950 transition hover:bg-gold-400 disabled:opacity-60"
      >
        {t("getCertificate")}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {t("errCertificate")}
        </p>
      )}
    </div>
  );
}
