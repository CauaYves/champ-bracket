import { MIN_BRACKET_ATHLETES } from "./single-elimination"

export type DivisionStatus = "draft" | "locked" | "in_progress" | "finished"

export type ChampionshipStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "finished"

export interface DivisionProgress {
  status: DivisionStatus
  hasBracket: boolean
  athleteCount: number
}

/** A division can have fights once drawn, or with enough athletes to draw. */
export function canHaveFights(division: DivisionProgress) {
  return division.hasBracket || division.athleteCount >= MIN_BRACKET_ATHLETES
}

/**
 * Whether every fight of the championship is over. Divisions that can never
 * have a fight (empty, or a lone athlete waiting for an opponent) are ignored;
 * approved athletes not yet placed in a division mean work is still pending.
 */
export function isChampionshipComplete(
  divisions: readonly DivisionProgress[],
  unassignedAthletes: number
) {
  const fightable = divisions.filter(canHaveFights)
  return (
    unassignedAthletes === 0 &&
    fightable.length > 0 &&
    fightable.every((d) => d.status === "finished")
  )
}

/**
 * Status the championship should move to, or `null` to leave it as is.
 * Registration statuses are manual; once registration is closed, the event
 * starts with the first started division and finishes/reopens on its own.
 */
export function nextChampionshipStatus(
  current: ChampionshipStatus,
  divisions: readonly DivisionProgress[],
  unassignedAthletes: number
): ChampionshipStatus | null {
  const started = divisions.some(
    (d) => d.status === "in_progress" || d.status === "finished"
  )
  const complete = isChampionshipComplete(divisions, unassignedAthletes)

  switch (current) {
    case "registration_closed":
      if (!started) return null
      return complete ? "finished" : "in_progress"
    case "in_progress":
      return complete ? "finished" : null
    case "finished":
      return complete ? null : "in_progress"
    default:
      return null
  }
}
