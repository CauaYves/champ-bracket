import { nextChampionshipStatus } from "@workspace/bracket-engine"

import { createClient } from "@/lib/supabase/server"

/**
 * Moves the championship through "Em andamento" / "Finalizado" to match its
 * divisions (rules in `nextChampionshipStatus`). Call after any change to
 * divisions, brackets or approvals.
 */
export async function syncChampionshipStatus(championshipId: string) {
  const supabase = await createClient()

  const [{ data: championship }, { data: divisions }, { data: approved }] =
    await Promise.all([
      supabase
        .from("championships")
        .select("status")
        .eq("id", championshipId)
        .single(),
      supabase
        .from("divisions")
        .select("id, status, has_bracket")
        .eq("championship_id", championshipId),
      supabase
        .from("registrations")
        .select("division_id")
        .eq("championship_id", championshipId)
        .eq("status", "approved"),
    ])
  if (!championship || !divisions || !approved) return

  const next = nextChampionshipStatus(
    championship.status,
    divisions.map((d) => ({
      status: d.status,
      hasBracket: d.has_bracket === true,
      athleteCount: approved.filter((r) => r.division_id === d.id).length,
    })),
    approved.filter((r) => !r.division_id).length
  )
  if (next) {
    await supabase
      .from("championships")
      .update({ status: next })
      .eq("id", championshipId)
      .eq("status", championship.status)
  }
}
