"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { criteriaSchema } from "@/lib/criteria"
import type { FormState } from "@/lib/form-state"
import type { Enums } from "@/lib/supabase/database.types"
import { createClient, getUserId } from "@/lib/supabase/server"

async function requireUser() {
  const userId = await getUserId()
  if (!userId) redirect("/entrar")
  return userId
}

const championshipSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do campeonato"),
  eventDate: z.iso.date("Informe a data do evento"),
  location: z.string().trim().min(2, "Informe o local"),
  presetId: z.uuid("Escolha uma modalidade"),
})

export async function createChampionship(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser()
  const parsed = championshipSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const supabase = await createClient()
  const { data: preset } = await supabase
    .from("presets")
    .select("criteria")
    .eq("id", parsed.data.presetId)
    .single()
  const criteria = criteriaSchema.safeParse(preset?.criteria)
  if (!criteria.success) {
    return { fieldErrors: { presetId: ["Modalidade inválida"] } }
  }

  const { data, error } = await supabase
    .from("championships")
    .insert({
      name: parsed.data.name,
      event_date: parsed.data.eventDate,
      location: parsed.data.location,
      criteria: criteria.data,
    })
    .select("id")
    .single()
  if (error) {
    return { error: "Não foi possível criar o campeonato." }
  }

  revalidatePath("/campeonatos")
  redirect(`/campeonatos/${data.id}`)
}

type ChampionshipStatus = Enums<"championship_status">

/** Status changes the organizer can make from each status (M1 scope). */
const allowedTransitions: Partial<
  Record<ChampionshipStatus, ChampionshipStatus[]>
> = {
  draft: ["registration_open"],
  registration_open: ["registration_closed"],
  registration_closed: ["registration_open"],
}

export async function updateChampionshipStatus(
  championshipId: string,
  status: ChampionshipStatus
) {
  await requireUser()
  const supabase = await createClient()

  const { data: championship } = await supabase
    .from("championships")
    .select("status")
    .eq("id", championshipId)
    .single()
  if (!championship) throw new Error("Campeonato não encontrado")
  if (!allowedTransitions[championship.status]?.includes(status)) {
    throw new Error("Mudança de status não permitida")
  }

  const { error } = await supabase
    .from("championships")
    .update({ status })
    .eq("id", championshipId)
  if (error) throw new Error("Não foi possível atualizar o status")

  revalidatePath(`/campeonatos/${championshipId}`)
}

export async function setRegistrationStatus(
  championshipId: string,
  registrationId: string,
  status: Enums<"registration_status">
) {
  await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("registrations")
    .update({ status })
    .eq("id", registrationId)
    .eq("championship_id", championshipId)
  if (error) throw new Error("Não foi possível atualizar a inscrição")

  revalidatePath(`/campeonatos/${championshipId}`)
}
