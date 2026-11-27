"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

type Role = "user" | "editor" | "admin";

export default function UserRoleSelect({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: Role;
  isSelf: boolean;
}) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const [value, setValue] = useState<Role>(role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Role;
    const prev = value;
    const supabase = getBrowserClient();
    if (!supabase) return;

    setValue(next);
    setBusy(true);
    setError(false);
    // الدالة تتحقق في القاعدة أن المنفّذ مدير وأنه لا يغيّر دوره بنفسه
    const { error: err } = await supabase.rpc("set_user_role", {
      target: userId,
      new_role: next,
    });
    setBusy(false);
    if (err) {
      setValue(prev);
      return setError(true);
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={onChange}
        disabled={busy || isSelf}
        aria-label={t("role")}
        className="rounded-md border border-navy-900/20 bg-white px-2 py-1 text-sm disabled:bg-slate-100"
      >
        {(["user", "editor", "admin"] as const).map((r) => (
          <option key={r} value={r}>
            {t(`roles.${r}`)}
          </option>
        ))}
      </select>
      {isSelf && <span className="text-xs text-navy-700/70">({t("you")})</span>}
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {t("errChange")}
        </span>
      )}
    </div>
  );
}
