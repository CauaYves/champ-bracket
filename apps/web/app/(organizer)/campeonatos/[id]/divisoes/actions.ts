"use server"

import {
  clearResult,
  createSingleElimination,
  getMatches,
  getPlacements,
  groupAthletes,
  recordWinner,
  swapEntries,
  totalRounds,
  type ResultChange,
  type SingleEliminationBracket,
} from "@workspace/bracket-engine"
import { revalidatePath } from "next/cache"

import { divisionName, matchLabel, parseBracket, toJson } from "@/lib/bracket"
import { criteriaSchema } from "@/lib/criteria"
import { createClient, requireUser } from "@/lib/supabase/server"

/** Result of the division actions, shown as a toast by `ActionButton`. */
export type ActionResult = {
  error?: string
  message?: string
  /** Labels of later matches that would lose their result; asks to confirm. */
  confirm?: string[]
}

function revalidate(championshipId: string, divisionId?: string) {
  revalidatePath(`/campeonatos/${championshipId}`)
  if (divisionId) {
    revalidatePath(`/campeonatos/${championshipId}/divisoes/${divisionId}`)
  }
}

async function loadDivision(divisionId: string) {
  const supabase = await createClient()
  const { data: division } = await supabase
    .from("divisions")
    .select("*")
    .eq("id", divisionId)
    .single()
  if (!division) throw new Error("Divisão não encontrada")
  return { supabase, division, bracket: parseBracket(division.bracket) }
}

export async function generateDivisions(
  championshipId: string
): Promise<ActionResult> {
  await requireUser()
  const supabase = await createClient()

  const { data: championship } = await supabase
    .from("championships")
    .select("status, criteria, event_date")
    .eq("id", championshipId)
    .single()
  if (!championship) return { error: "Campeonato não encontrado." }
  if (!["registration_closed", "in_progress"].includes(championship.status)) {
    return { error: "Encerre as inscrições antes de montar as divisões." }
  }
  const criteria = criteriaSchema.safeParse(championship.criteria)
  if (!criteria.success) return { error: "Modalidade inválida." }

  const [{ data: athletes }, { data: divisions }] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, gender, birth_date, belt")
      .eq("championship_id", championshipId)
      .eq("status", "approved")
      .is("division_id", null),
    supabase
      .from("divisions")
      .select("id, group_key, bracket")
      .eq("championship_id", championshipId),
  ])
  if (!athletes?.length) {
    return { message: "Todos os atletas aprovados já estão em divisões." }
  }

  const groups = groupAthletes(
    athletes.map((a) => ({
      id: a.id,
      gender: a.gender,
      birthDate: a.birth_date,
      belt: a.belt,
    })),
    criteria.data,
    Number(championship.event_date.slice(0, 4))
  )

  let assigned = 0
  let skipped = 0
  let created = 0
  for (const group of groups) {
    let division = divisions?.find((d) => d.group_key === group.key)
    if (division?.bracket) {
      // Bracket already drawn: the organizer places latecomers by hand.
      skipped += group.athleteIds.length
      continue
    }
    if (!division) {
      const { data, error } = await supabase
        .from("divisions")
        .insert({
          championship_id: championshipId,
          name: divisionName(group),
          group_key: group.key,
        })
        .select("id, group_key, bracket")
        .single()
      if (error) {
        console.error("generateDivisions", error)
        return { error: "Não foi possível criar as divisões." }
      }
      division = data
      created++
    }
    const { error } = await supabase
      .from("registrations")
      .update({ division_id: division.id })
      .in("id", group.athleteIds)
    if (error) {
      console.error("generateDivisions", error)
      return { error: "Não foi possível distribuir os atletas." }
    }
    assigned += group.athleteIds.length
  }

  revalidate(championshipId)
  const parts = [`${assigned} atleta(s) distribuído(s)`]
  if (created) parts.push(`${created} divisão(ões) criada(s)`)
  if (skipped) {
    parts.push(`${skipped} sem divisão (chave já sorteada; mova manualmente)`)
  }
  return { message: parts.join(" · ") }
}

export async function createDivision(
  championshipId: string,
  name: string
): Promise<ActionResult> {
  await requireUser()
  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: "Informe o nome da divisão." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("divisions")
    .insert({ championship_id: championshipId, name: trimmed })
  if (error) {
    console.error("createDivision", error)
    return { error: "Não foi possível criar a divisão." }
  }
  revalidate(championshipId)
  return { message: "Divisão criada" }
}

export async function deleteDivision(
  divisionId: string
): Promise<ActionResult> {
  await requireUser()
  const { supabase, division, bracket } = await loadDivision(divisionId)
  if (bracket) return { error: "Descarte a chave antes de excluir a divisão." }

  // Athletes go back to "sem divisão" (FK on delete set null).
  const { error } = await supabase
    .from("divisions")
    .delete()
    .eq("id", divisionId)
  if (error) return { error: "Não foi possível excluir a divisão." }
  revalidate(division.championship_id)
  return { message: "Divisão excluída" }
}

export async function moveAthlete(
  registrationId: string,
  fromDivisionId: string,
  toDivisionId: string | null
): Promise<ActionResult> {
  await requireUser()
  const from = await loadDivision(fromDivisionId)
  if (from.bracket) return { error: "A chave desta divisão já foi sorteada." }
  if (toDivisionId) {
    const to = await loadDivision(toDivisionId)
    if (to.bracket) {
      return { error: "A chave da divisão de destino já foi sorteada." }
    }
  }

  const { error } = await from.supabase
    .from("registrations")
    .update({ division_id: toDivisionId })
    .eq("id", registrationId)
    .eq("division_id", fromDivisionId)
  if (error) return { error: "Não foi possível mover o atleta." }

  revalidate(from.division.championship_id, fromDivisionId)
  if (toDivisionId) revalidate(from.division.championship_id, toDivisionId)
  return { message: "Atleta movido" }
}

export async function setThirdPlaceMatch(
  divisionId: string,
  enabled: boolean
): Promise<ActionResult> {
  await requireUser()
  const { supabase, division, bracket } = await loadDivision(divisionId)
  if (division.status !== "draft") {
    return { error: "Não é possível alterar depois de iniciar as lutas." }
  }

  const { data: updated, error } = await supabase
    .from("divisions")
    .update({
      third_place_match: enabled,
      bracket: bracket
        ? toJson({
            ...bracket,
            thirdPlaceMatch: enabled && bracket.entries.length >= 4,
          })
        : null,
    })
    .eq("id", divisionId)
    .select("id")
  if (error || !updated.length) return { error: "Não foi possível salvar." }

  revalidate(division.championship_id, divisionId)
  return {}
}

/** Draws (or redraws) the bracket with the division's approved athletes. */
export async function drawBracket(divisionId: string): Promise<ActionResult> {
  await requireUser()
  const { supabase, division } = await loadDivision(divisionId)
  if (division.status !== "draft") {
    return { error: "As lutas desta divisão já começaram." }
  }

  const { data: athletes } = await supabase
    .from("registrations")
    .select("id")
    .eq("division_id", divisionId)
    .eq("status", "approved")
  if (!athletes || athletes.length < 2) {
    return { error: "A divisão precisa de pelo menos 2 atletas." }
  }

  const bracket = createSingleElimination(
    athletes.map((a) => a.id),
    { thirdPlaceMatch: division.third_place_match }
  )
  const { error } = await supabase
    .from("divisions")
    .update({ bracket: toJson(bracket) })
    .eq("id", divisionId)
  if (error) return { error: "Não foi possível sortear a chave." }

  revalidate(division.championship_id, divisionId)
  return { message: "Chave sorteada" }
}

export async function discardBracket(
  divisionId: string
): Promise<ActionResult> {
  await requireUser()
  const { supabase, division } = await loadDivision(divisionId)
  if (division.status !== "draft") {
    return { error: "As lutas desta divisão já começaram." }
  }
  const { error } = await supabase
    .from("divisions")
    .update({ bracket: null })
    .eq("id", divisionId)
  if (error) return { error: "Não foi possível descartar a chave." }

  revalidate(division.championship_id, divisionId)
  return { message: "Chave descartada" }
}

export async function swapBracketSlots(
  divisionId: string,
  from: number,
  to: number
): Promise<ActionResult> {
  await requireUser()
  const { supabase, division, bracket } = await loadDivision(divisionId)
  if (!bracket || division.status !== "draft") {
    return { error: "A chave não pode mais ser reorganizada." }
  }

  let swapped: SingleEliminationBracket
  try {
    swapped = swapEntries(bracket, from, to)
  } catch {
    return { error: "Posição inválida." }
  }
  const { error } = await supabase
    .from("divisions")
    .update({ bracket: toJson(swapped) })
    .eq("id", divisionId)
  if (error) return { error: "Não foi possível trocar os atletas." }

  revalidate(division.championship_id, divisionId)
  return {}
}

/** Locks the draw and starts recording results. */
export async function startDivision(divisionId: string): Promise<ActionResult> {
  await requireUser()
  const { supabase, division, bracket } = await loadDivision(divisionId)
  if (!bracket || division.status !== "draft") {
    return { error: "Sorteie a chave antes de iniciar." }
  }

  const { error } = await supabase
    .from("divisions")
    .update({ status: "in_progress" })
    .eq("id", divisionId)
  if (error) return { error: "Não foi possível iniciar as lutas." }

  await supabase
    .from("championships")
    .update({ status: "in_progress" })
    .eq("id", division.championship_id)
    .eq("status", "registration_closed")

  revalidate(division.championship_id, divisionId)
  return { message: "Lutas iniciadas" }
}

async function saveResultChange(
  divisionId: string,
  bracket: SingleEliminationBracket,
  change: ResultChange,
  confirmed: boolean
): Promise<ActionResult> {
  if (change.cleared.length > 0 && !confirmed) {
    const rounds = totalRounds(bracket)
    const matches = getMatches(bracket)
    return {
      confirm: change.cleared.map((id) => {
        const match = matches.find((m) => m.id === id)
        return match ? matchLabel(match, rounds) : id
      }),
    }
  }

  const { supabase, division } = await loadDivision(divisionId)
  const finished = getPlacements(change.bracket).gold !== null
  const { error } = await supabase
    .from("divisions")
    .update({
      bracket: toJson(change.bracket),
      status: finished ? "finished" : "in_progress",
    })
    .eq("id", divisionId)
  if (error) return { error: "Não foi possível salvar o resultado." }

  revalidate(division.championship_id, divisionId)
  return {}
}

export async function recordMatchWinner(
  divisionId: string,
  matchId: string,
  winnerId: string,
  confirmed = false
): Promise<ActionResult> {
  await requireUser()
  const { division, bracket } = await loadDivision(divisionId)
  if (!bracket || division.status === "draft") {
    return { error: "Inicie as lutas antes de registrar resultados." }
  }

  let change: ResultChange
  try {
    change = recordWinner(bracket, matchId, winnerId)
  } catch {
    return { error: "Esta luta ainda não pode ser decidida." }
  }
  return saveResultChange(divisionId, bracket, change, confirmed)
}

export async function undoMatchResult(
  divisionId: string,
  matchId: string,
  confirmed = false
): Promise<ActionResult> {
  await requireUser()
  const { division, bracket } = await loadDivision(divisionId)
  if (!bracket || division.status === "draft") {
    return { error: "Não há resultados para desfazer." }
  }
  return saveResultChange(
    divisionId,
    bracket,
    clearResult(bracket, matchId),
    confirmed
  )
}
