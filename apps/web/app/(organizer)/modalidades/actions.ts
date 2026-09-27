"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { criteriaSchema } from "@/lib/criteria"
import { errorMessage, type FormState } from "@/lib/form-state"
import { createClient, getUserId } from "@/lib/supabase/server"

async function requireUser() {
  const userId = await getUserId()
  if (!userId) redirect("/entrar")
  return userId
}

const presetSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da modalidade"),
  adultAge: z.coerce
    .number("Informe a idade")
    .int("Informe um número inteiro")
    .min(1, "Idade inválida")
    .max(99, "Idade inválida"),
  belts: z
    .string()
    .transform((value) => [
      ...new Set(
        value
          .split("\n")
          .map((belt) => belt.trim())
          .filter(Boolean)
      ),
    ])
    .pipe(z.array(z.string()).min(1, "Informe pelo menos uma faixa")),
  ageCategories: z
    .array(
      z
        .object({
          name: z.string().trim().min(1, "Informe o nome de cada categoria"),
          minAge: z.coerce
            .number("Informe a idade mínima")
            .int("Idades devem ser números inteiros")
            .min(0, "Idade mínima inválida"),
          maxAge: z
            .string()
            .trim()
            .transform((value) => (value === "" ? null : Number(value)))
            .pipe(
              z.number().int("Idades devem ser números inteiros").nullable()
            ),
        })
        .refine((c) => c.maxAge === null || c.maxAge >= c.minAge, {
          message: "A idade máxima deve ser maior ou igual à mínima",
          path: ["maxAge"],
        })
    )
    .min(1, "Informe pelo menos uma categoria de idade"),
})

function parsePreset(formData: FormData) {
  const names = formData.getAll("categoryName")
  const mins = formData.getAll("categoryMin")
  const maxes = formData.getAll("categoryMax")

  return presetSchema.safeParse({
    name: formData.get("name"),
    adultAge: formData.get("adultAge"),
    belts: formData.get("belts") ?? "",
    ageCategories: names.map((name, i) => ({
      name,
      minAge: mins[i],
      maxAge: maxes[i] ?? "",
    })),
  })
}

/** Flattens nested category errors into a single `ageCategories` message list. */
function toFormState(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form")
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  return { fieldErrors }
}

export async function savePreset(
  presetId: string | null,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requireUser()
  const parsed = parsePreset(formData)
  if (!parsed.success) return toFormState(parsed.error)

  const { name, ...rest } = parsed.data
  const criteria = criteriaSchema.parse(rest)
  const supabase = await createClient()

  const { error } = presetId
    ? await supabase
        .from("presets")
        .update({ name, criteria })
        .eq("id", presetId)
        .eq("owner_id", userId)
    : await supabase
        .from("presets")
        .insert({ name, criteria, owner_id: userId })

  if (error) {
    console.error("savePreset", error)
    return {
      error: errorMessage("Não foi possível salvar a modalidade.", error),
    }
  }

  revalidatePath("/modalidades")
  redirect("/modalidades")
}

export async function duplicatePreset(presetId: string) {
  const userId = await requireUser()
  const supabase = await createClient()

  const { data: preset } = await supabase
    .from("presets")
    .select("name, criteria")
    .eq("id", presetId)
    .single()
  if (!preset) throw new Error("Modalidade não encontrada")

  const { data, error } = await supabase
    .from("presets")
    .insert({
      name: `${preset.name} (cópia)`,
      criteria: preset.criteria,
      owner_id: userId,
    })
    .select("id")
    .single()
  if (error) {
    console.error(error)
    throw new Error("Não foi possível duplicar a modalidade")
  }

  revalidatePath("/modalidades")
  redirect(`/modalidades/${data.id}`)
}

export async function deletePreset(presetId: string) {
  const userId = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("presets")
    .delete()
    .eq("id", presetId)
    .eq("owner_id", userId)
  if (error) {
    console.error(error)
    throw new Error("Não foi possível excluir a modalidade")
  }

  revalidatePath("/modalidades")
}
