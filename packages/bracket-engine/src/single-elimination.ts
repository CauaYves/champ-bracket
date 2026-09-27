import { nextPowerOfTwo, seedOrder, shuffle } from "./seeding"
import type {
  AthleteId,
  Match,
  MatchId,
  MatchResult,
  MatchStatus,
  Placements,
  SingleEliminationBracket,
  Slot,
} from "./types"

export const THIRD_PLACE_MATCH_ID: MatchId = "third-place"

export function mainMatchId(round: number, position: number): MatchId {
  return `r${round}m${position}`
}

export interface CreateSingleEliminationOptions {
  /** Play a 3rd-place match instead of awarding two bronzes. */
  thirdPlaceMatch?: boolean
  /** Source of randomness for the draw; defaults to `Math.random`. */
  random?: () => number
}

/**
 * Random draw into the smallest power-of-2 bracket. Byes take the highest
 * seed positions, so they are spread evenly and never face each other.
 */
export function createSingleElimination(
  athletes: readonly AthleteId[],
  options: CreateSingleEliminationOptions = {}
): SingleEliminationBracket {
  if (athletes.length < 2) {
    throw new RangeError("A bracket needs at least 2 athletes")
  }
  if (new Set(athletes).size !== athletes.length) {
    throw new Error("Duplicate athlete ids")
  }

  const size = nextPowerOfTwo(athletes.length)
  const drawn = shuffle(athletes, options.random ?? Math.random)

  return {
    format: "single_elimination",
    entries: seedOrder(size).map((seed) => drawn[seed - 1] ?? null),
    thirdPlaceMatch: Boolean(options.thirdPlaceMatch) && size >= 4,
    results: {},
  }
}

export function totalRounds(bracket: SingleEliminationBracket): number {
  return Math.log2(bracket.entries.length)
}

export function getMatches(bracket: SingleEliminationBracket): Match[] {
  return resolve(bracket).matches
}

export function getMatch(
  bracket: SingleEliminationBracket,
  matchId: MatchId
): Match {
  const match = getMatches(bracket).find((m) => m.id === matchId)
  if (!match) throw new Error(`Unknown match: ${matchId}`)
  return match
}

export interface ResultChange {
  bracket: SingleEliminationBracket
  /** Later matches whose results were discarded because their fighters changed. */
  cleared: MatchId[]
}

/**
 * Records (or changes) the winner of a match. Changing a winner discards every
 * later result that no longer involves the same two fighters; call this
 * without saving to preview `cleared` and ask the organizer to confirm.
 */
export function recordWinner(
  bracket: SingleEliminationBracket,
  matchId: MatchId,
  winnerId: AthleteId
): ResultChange {
  const match = getMatch(bracket, matchId)
  if (match.status !== "ready" && match.status !== "done") {
    throw new Error(`Match ${matchId} cannot be decided (${match.status})`)
  }
  const [a, b] = match.slots.map(athleteOf)
  if (winnerId !== a && winnerId !== b) {
    throw new Error(`Athlete ${winnerId} is not in match ${matchId}`)
  }
  const loserId = (winnerId === a ? b : a)!

  return normalize({
    ...bracket,
    results: { ...bracket.results, [matchId]: { winnerId, loserId } },
  })
}

/** Removes a match result; later results that depended on it are discarded too. */
export function clearResult(
  bracket: SingleEliminationBracket,
  matchId: MatchId
): ResultChange {
  const results = { ...bracket.results }
  delete results[matchId]
  return normalize({ ...bracket, results })
}

/**
 * Swaps two first-round slots (drag & drop). Only allowed before any result
 * is recorded. Either slot may be a bye.
 */
export function swapEntries(
  bracket: SingleEliminationBracket,
  from: number,
  to: number
): SingleEliminationBracket {
  if (Object.keys(bracket.results).length > 0) {
    throw new Error("Cannot rearrange a bracket that already has results")
  }
  const { entries } = bracket
  if (!(from in entries) || !(to in entries)) {
    throw new RangeError(`Invalid slot index: ${from} or ${to}`)
  }
  const swapped = [...entries]
  ;[swapped[from], swapped[to]] = [entries[to]!, entries[from]!]
  return { ...bracket, entries: swapped }
}

/**
 * Medals decided so far. Without a 3rd-place match both semifinal losers get
 * bronze; with one, only its winner does.
 */
export function getPlacements(bracket: SingleEliminationBracket): Placements {
  const matches = getMatches(bracket)
  const rounds = totalRounds(bracket)
  const final = matches.find((m) => m.stage === "main" && m.round === rounds)

  let bronze: AthleteId[]
  if (bracket.thirdPlaceMatch) {
    const third = matches.find((m) => m.stage === "third_place")
    bronze = third?.winnerId ? [third.winnerId] : []
  } else {
    bronze = matches
      .filter((m) => m.stage === "main" && m.round === rounds - 1)
      .flatMap((m) => (m.status === "done" && m.loserId ? [m.loserId] : []))
  }

  return {
    gold: final?.winnerId ?? null,
    silver: final?.status === "done" ? final.loserId : null,
    bronze,
  }
}

const BYE: Slot = { type: "bye" }
const PENDING: Slot = { type: "pending" }

function athlete(athleteId: AthleteId): Slot {
  return { type: "athlete", athleteId }
}

function athleteOf(slot: Slot): AthleteId | null {
  return slot.type === "athlete" ? slot.athleteId : null
}

interface Outcome {
  status: MatchStatus
  winner: Slot
  loser: Slot
  /** A stored result that no longer matches this match's fighters. */
  stale: boolean
}

function decide(slots: [Slot, Slot], result: MatchResult | undefined): Outcome {
  const [a, b] = slots
  const stale = result !== undefined

  if (a.type === "pending" || b.type === "pending") {
    return { status: "waiting", winner: PENDING, loser: PENDING, stale }
  }
  if (a.type === "bye" || b.type === "bye") {
    const winner = a.type === "athlete" ? a : b
    return { status: "bye", winner, loser: BYE, stale }
  }

  const fighters = [a.athleteId, b.athleteId]
  if (
    result &&
    result.winnerId !== result.loserId &&
    fighters.includes(result.winnerId) &&
    fighters.includes(result.loserId)
  ) {
    return {
      status: "done",
      winner: athlete(result.winnerId),
      loser: athlete(result.loserId),
      stale: false,
    }
  }
  return { status: "ready", winner: PENDING, loser: PENDING, stale }
}

function resolve(bracket: SingleEliminationBracket) {
  const rounds = totalRounds(bracket)
  const matches: Match[] = []
  const stale: MatchId[] = []

  const push = (
    id: MatchId,
    stage: Match["stage"],
    round: number,
    position: number,
    slots: [Slot, Slot]
  ) => {
    const outcome = decide(slots, bracket.results[id])
    if (outcome.stale) stale.push(id)

    const isMain = stage === "main"
    matches.push({
      id,
      stage,
      round,
      position,
      slots,
      status: outcome.status,
      winnerId: athleteOf(outcome.winner),
      loserId: athleteOf(outcome.loser),
      winnerTo:
        isMain && round < rounds
          ? {
              matchId: mainMatchId(round + 1, Math.floor(position / 2)),
              slot: (position % 2) as 0 | 1,
            }
          : null,
      loserTo:
        isMain && bracket.thirdPlaceMatch && round === rounds - 1
          ? { matchId: THIRD_PLACE_MATCH_ID, slot: position as 0 | 1 }
          : null,
    })
    return outcome
  }

  let slots: Slot[] = bracket.entries.map((e) =>
    e === null ? BYE : athlete(e)
  )
  const semifinalLosers: Slot[] = []

  for (let round = 1; round <= rounds; round++) {
    const winners: Slot[] = []
    for (let position = 0; position < slots.length / 2; position++) {
      const pair: [Slot, Slot] = [
        slots[2 * position]!,
        slots[2 * position + 1]!,
      ]
      const outcome = push(
        mainMatchId(round, position),
        "main",
        round,
        position,
        pair
      )
      winners.push(outcome.winner)
      if (round === rounds - 1) semifinalLosers.push(outcome.loser)
    }
    slots = winners
  }

  if (bracket.thirdPlaceMatch && rounds >= 2) {
    push(THIRD_PLACE_MATCH_ID, "third_place", rounds, 1, [
      semifinalLosers[0]!,
      semifinalLosers[1]!,
    ])
  }

  return { matches, stale }
}

/**
 * Drops results that no longer fit. A single pass is enough: a dropped result
 * turns later slots into `pending`, which marks their results stale in the
 * same pass.
 */
function normalize(bracket: SingleEliminationBracket): ResultChange {
  const { stale } = resolve(bracket)
  if (stale.length === 0) return { bracket, cleared: [] }

  const results = { ...bracket.results }
  for (const id of stale) delete results[id]
  return { bracket: { ...bracket, results }, cleared: stale }
}
