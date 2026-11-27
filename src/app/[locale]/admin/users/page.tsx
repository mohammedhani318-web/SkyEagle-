import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import UserRoleSelect from "@/components/admin/UserRoleSelect";
import { getStaffContext } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsers({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getStaffContext();
  if (!ctx) return redirect({ href: "/login", locale });
  if (ctx.role !== "admin") return redirect({ href: "/admin", locale });

  const { data } = await ctx.supabase
    .from("profiles")
    .select("id, display_name, email, role")
    .order("updated_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];

  const t = await getTranslations("admin.users");

  return (
    <div className="space-y-6">
      <p className="text-sm text-navy-700">{t("hint")}</p>
      <div className="overflow-x-auto rounded-2xl border border-navy-900/10 bg-white shadow-sm">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-slate-50 text-navy-700">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t("name")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("email")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("role")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/10">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-semibold text-navy-900">
                  {u.display_name || "—"}
                </td>
                <td dir="ltr" className="px-4 py-3 text-start text-navy-700">
                  {u.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <UserRoleSelect
                    userId={u.id}
                    role={u.role}
                    isSelf={u.id === ctx.user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
