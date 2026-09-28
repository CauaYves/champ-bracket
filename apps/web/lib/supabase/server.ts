import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import type { Database } from "./database.types"

/** Supabase client for Server Components, Server Actions and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // The proxy refreshes the session instead.
          }
        },
      },
    }
  )
}

/** Returns the signed-in user id, or null. Verifies the JWT. */
export async function getUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub ?? null
}

/** For Server Actions: the signed-in user id, or a redirect to sign-in. */
export async function requireUser() {
  const userId = await getUserId()
  if (!userId) redirect("/entrar")
  return userId
}
