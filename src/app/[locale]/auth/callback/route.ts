import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale = (routing.locales as readonly string[]).includes(raw)
    ? raw
    : routing.defaultLocale;

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}/${locale}/profile`);
    }
  }
  return NextResponse.redirect(`${origin}/${locale}/login`);
}
