import type {
  DivisionGroup,
  Match,
  SingleEliminationBracket,
} from "@workspace/bracket-engine"
import { z } from "zod"

import { genderLabel } from "@/lib/labels"
import type { Json } from "@/lib/supabase/database.types"

const bracketSchema = z.object({
  format: z.literal("single_elimination"),
  entries: z.array(z.string().nullable()),
  thirdPlaceMatch: z.boolean(),
  results: z.record(
    z.string(),
    z.object({ winnerId: z.string(), loserId: z.string() })
  ),
})

/** Validates a `divisions.bracket` column; `null` when absent or malformed. */
export function parseBracket(
  value: Json | null | undefined
): SingleEliminationBracket | null {
  const parsed = bracketSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function toJson(bracket: SingleEliminationBracket): Json {
  return bracket as unknown as Json
}

/** pt-BR round name, counted from the final backwards. */
export function roundLabel(round: number, totalRounds: number) {
  switch (totalRounds - round) {
    case 0:
      return "Final"
    case 1:
      return "Semifinal"
    case 2:
      return "Quartas de final"
    case 3:
      return "Oitavas de final"
    default:
      return `${round}ª rodada`
  }
}

export function matchLabel(match: Match, totalRounds: number) {
  if (match.stage === "third_place") return "Disputa de 3º lugar"
  const round = roundLabel(match.round, totalRounds)
  const matchesInRound = 2 ** (totalRounds - match.round)
  return matchesInRound > 1 ? `${round} · Luta ${match.position + 1}` : round
}

export function divisionName(group: DivisionGroup) {
  return [
    genderLabel[group.gender],
    group.ageCategory ?? "Sem categoria de idade",
    `Faixa ${group.belt}`,
  ].join(" · ")
}

export type AthleteInfo = {
  name: string
  academy: string
  /** Extra rows for the organizer (age, weight, contact…). Never public. */
  details?: { label: string; value: string }[]
}
export type AthleteMap = Record<string, AthleteInfo>
