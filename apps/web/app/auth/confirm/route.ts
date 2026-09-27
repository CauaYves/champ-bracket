import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/** Landing point for the email confirmation link. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  const supabase = await createClient()
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("Missing code") }

  const url = request.nextUrl.clone()
  url.search = ""
  url.pathname = error ? "/entrar" : "/campeonatos"
  if (error) url.searchParams.set("erro", "confirmacao")
  return NextResponse.redirect(url)
}
