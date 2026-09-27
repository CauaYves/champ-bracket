export type AthleteId = string
export type MatchId = string

/**
 * What occupies one side of a match:
 * - `athlete`: known athlete
 * - `bye`: permanently empty (no opponent will ever come from here)
 * - `pending`: will be filled once an earlier match is decided
 */
export type Slot =
  | { type: "athlete"; athleteId: AthleteId }
  | { type: "bye" }
  | { type: "pending" }

export type MatchStage = "main" | "third_place"

/**
 * - `waiting`: at least one side is still pending
 * - `ready`: both athletes known, no result yet
 * - `done`: result recorded
 * - `bye`: decided automatically (one or both sides are byes)
 */
export type MatchStatus = "waiting" | "ready" | "done" | "bye"

export interface MatchResult {
  winnerId: AthleteId
  loserId: AthleteId
}

export interface MatchLink {
  matchId: MatchId
  slot: 0 | 1
}

export interface Match {
  id: MatchId
  stage: MatchStage
  /** 1-based; the final is round `totalRounds`. */
  round: number
  /** 0-based position within the round, top to bottom. */
  position: number
  slots: [Slot, Slot]
  status: MatchStatus
  winnerId: AthleteId | null
  loserId: AthleteId | null
  /** Where the winner goes. `null` for the final and the 3rd-place match. */
  winnerTo: MatchLink | null
  /** Where the loser goes (semifinal losers → 3rd-place match). */
  loserTo: MatchLink | null
}

export interface SingleEliminationBracket {
  format: "single_elimination"
  /**
   * First-round slots, top to bottom (length = bracket size, a power of 2).
   * `null` is a bye. Pairs `[2i, 2i+1]` form first-round match `i`.
   */
  entries: (AthleteId | null)[]
  thirdPlaceMatch: boolean
  /** Results keyed by match id. Only matches actually fought are stored. */
  results: Record<MatchId, MatchResult>
}

export interface Placements {
  gold: AthleteId | null
  silver: AthleteId | null
  bronze: AthleteId[]
}
