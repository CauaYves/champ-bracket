"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import type { FormState } from "@/lib/form-state"
import { createClient } from "@/lib/supabase/server"

const signInSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
})

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome"),
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
})

/** Only allow same-site relative redirects. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : ""
  return next.startsWith("/") && !next.startsWith("//") ? next : "/campeonatos"
}

export async function signIn(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { error: "E-mail ou senha incorretos." }
  }

  redirect(safeNext(formData.get("next")))
}

export async function signUp(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const origin = (await headers()).get("origin") ?? ""
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  })
  if (error) {
    return { error: "Não foi possível criar a conta. Tente novamente." }
  }

  // Email confirmation disabled → already signed in.
  if (data.session) redirect("/campeonatos")
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/entrar")
}
