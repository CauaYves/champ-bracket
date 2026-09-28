import { cache } from "react"
import { z } from "zod"

import { parseBracket, type AthleteMap } from "@/lib/bracket"
import type { Json } from "@/lib/supabase/database.types"

import { createClient } from "@/lib/supabase/server"

/** Public championship info (no personal data), deduplicated per request. */
export const getPublicChampionship = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_public_championship", { slug })
  const championship = data?.[0]
  if (!championship) return null
  return {
    ...championship,
    belts: Array.isArray(championship.belts)
      ? championship.belts.map(String)
      : [],
  }
})

const publicDivisionsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["draft", "locked", "in_progress", "finished"]),
    bracket: z.unknown(),
    athletes: z.array(
      z.object({ id: z.string(), name: z.string(), academy: z.string() })
    ),
  })
)

/** Divisions with a drawn bracket; athletes carry only name and academy. */
export async function getPublicDivisions(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_public_divisions", { slug })
  const parsed = publicDivisionsSchema.safeParse(data)
  if (!parsed.success) return []

  return parsed.data.flatMap((division) => {
    const bracket = parseBracket(division.bracket as Json)
    if (!bracket) return []
    const athletes: AthleteMap = Object.fromEntries(
      division.athletes.map((a) => [a.id, { name: a.name, academy: a.academy }])
    )
    return [{ ...division, bracket, athletes }]
  })
}
