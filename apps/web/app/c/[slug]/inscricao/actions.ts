"use server"

import { z } from "zod"

import type { FormState } from "@/lib/form-state"
import { createClient } from "@/lib/supabase/server"

const registrationSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo"),
  birthDate: z.iso.date("Informe a data de nascimento"),
  gender: z.enum(["male", "female"], "Selecione o sexo"),
  weightKg: z.coerce
    .number("Informe o peso")
    .positive("Informe o peso")
    .max(400, "Peso inválido"),
  belt: z.string().min(1, "Selecione a faixa"),
  academy: z.string().trim().min(2, "Informe a academia ou equipe"),
  coach: z.string().trim().default(""),
  phone: z.string().trim().min(8, "Informe um telefone válido"),
  email: z.email("Informe um e-mail válido"),
  consent: z.literal("on", "É necessário aceitar para se inscrever"),
  guardianName: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
  guardianConsent: z.literal("on").optional(),
})

const rpcErrors: Record<string, FormState> = {
  championship_not_found: { error: "Campeonato não encontrado." },
  registration_closed: {
    error: "As inscrições deste campeonato estão encerradas.",
  },
  consent_required: {
    fieldErrors: { consent: ["É necessário aceitar para se inscrever"] },
  },
  invalid_belt: { fieldErrors: { belt: ["Faixa inválida"] } },
  guardian_required: {
    error:
      "Atletas menores de idade precisam dos dados e da autorização do responsável.",
  },
}

export async function submitRegistration(
  slug: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.rpc("submit_registration", {
    slug,
    full_name: data.fullName,
    birth_date: data.birthDate,
    gender: data.gender,
    weight_kg: data.weightKg,
    belt: data.belt,
    academy: data.academy,
    coach: data.coach,
    phone: data.phone,
    email: data.email,
    consent: true,
    guardian_name: data.guardianName || undefined,
    guardian_phone: data.guardianPhone || undefined,
    guardian_consent: data.guardianConsent === "on",
  })

  if (error) {
    const known = Object.keys(rpcErrors).find((code) =>
      error.message.includes(code)
    )
    return known
      ? rpcErrors[known]!
      : { error: "Não foi possível enviar a inscrição. Tente novamente." }
  }

  return { success: true }
}
