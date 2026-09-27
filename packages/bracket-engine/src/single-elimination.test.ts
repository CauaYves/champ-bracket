import { describe, expect, it } from "vitest"

import {
  THIRD_PLACE_MATCH_ID,
  clearResult,
  createSingleElimination,
  getMatch,
  getMatches,
  getPlacements,
  mainMatchId,
  recordWinner,
  swapEntries,
  totalRounds,
} from "./single-elimination"
import type { SingleEliminationBracket } from "./types"

/** Makes `shuffle` keep the input order, so seed n = athletes[n - 1]. */
const noShuffle = () => 0.999999

function draw(athletes: string[], thirdPlaceMatch = false) {
  return createSingleElimination(athletes, {
    random: noShuffle,
    thirdPlaceMatch,
  })
}

function win(
  bracket: SingleEliminationBracket,
  matchId: string,
  winner: string
) {
  return recordWinner(bracket, matchId, winner).bracket
}

describe("createSingleElimination", () => {
  it("places athletes by standard seed order", () => {
    const bracket = draw(["A", "B", "C", "D"])
    expect(bracket.entries).toEqual(["A", "D", "B", "C"])
    expect(totalRounds(bracket)).toBe(2)
  })

  it("spreads byes so they face the top seeds and never each other", () => {
    const bracket = draw(["A", "B", "C", "D", "E"])
    expect(bracket.entries).toHaveLength(8)
    expect(bracket.entries).toEqual(["A", null, "D", "E", "B", null, "C", null])

    const firstRound = getMatches(bracket).filter((m) => m.round === 1)
    expect(firstRound.filter((m) => m.status === "bye")).toHaveLength(3)
  })

  it("advances bye athletes to round 2 automatically", () => {
    const bracket = draw(["A", "B", "C", "D", "E"])
    const semi = getMatch(bracket, mainMatchId(2, 1))
    expect(semi.status).toBe("ready")
    expect(semi.slots).toEqual([
      { type: "athlete", athleteId: "B" },
      { type: "athlete", athleteId: "C" },
    ])
  })

  it("includes every athlete exactly once with a random draw", () => {
    const athletes = Array.from({ length: 11 }, (_, i) => `athlete-${i}`)
    const bracket = createSingleElimination(athletes)
    const placed = bracket.entries.filter((e) => e !== null)
    expect(placed.sort()).toEqual([...athletes].sort())
    expect(bracket.entries).toHaveLength(16)
  })

  it("rejects fewer than 2 athletes and duplicates", () => {
    expect(() => draw(["A"])).toThrow(RangeError)
    expect(() => draw(["A", "A"])).toThrow(/Duplicate/)
  })

  it("ignores the 3rd-place option when there are no semifinals", () => {
    expect(draw(["A", "B"], true).thirdPlaceMatch).toBe(false)
  })
})

describe("recordWinner", () => {
  it("advances the winner and exposes the links", () => {
    let bracket = draw(["A", "B", "C", "D"])
    const semi = getMatch(bracket, mainMatchId(1, 0))
    expect(semi.winnerTo).toEqual({ matchId: mainMatchId(2, 0), slot: 0 })

    bracket = win(bracket, semi.id, "D")
    expect(getMatch(bracket, mainMatchId(2, 0)).slots[0]).toEqual({
      type: "athlete",
      athleteId: "D",
    })
  })

  it("rejects matches that cannot be decided and non-participants", () => {
    const bracket = draw(["A", "B", "C", "D", "E"])
    expect(() => recordWinner(bracket, mainMatchId(3, 0), "A")).toThrow(
      /waiting/
    )
    expect(() => recordWinner(bracket, mainMatchId(1, 0), "A")).toThrow(/bye/)
    expect(() => recordWinner(bracket, mainMatchId(1, 1), "A")).toThrow(
      /not in match/
    )
  })

  it("clears later results whose fighters changed, even if the winner stayed", () => {
    // Round 1: A beats D, B beats C. Final: B beats A.
    let bracket = draw(["A", "B", "C", "D"])
    bracket = win(bracket, mainMatchId(1, 0), "A")
    bracket = win(bracket, mainMatchId(1, 1), "B")
    bracket = win(bracket, mainMatchId(2, 0), "B")

    // Correction: D actually beat A. B never fought D, so the final is void.
    const change = recordWinner(bracket, mainMatchId(1, 0), "D")
    expect(change.cleared).toEqual([mainMatchId(2, 0)])
    expect(getMatch(change.bracket, mainMatchId(2, 0)).status).toBe("ready")
    expect(getPlacements(change.bracket).gold).toBeNull()
  })

  it("cascades through several rounds", () => {
    const athletes = ["A", "B", "C", "D", "E", "F", "G", "H"]
    let bracket = draw(athletes)
    // entries: A H D E B G C F
    bracket = win(bracket, mainMatchId(1, 0), "A")
    bracket = win(bracket, mainMatchId(1, 1), "D")
    bracket = win(bracket, mainMatchId(1, 2), "B")
    bracket = win(bracket, mainMatchId(1, 3), "C")
    bracket = win(bracket, mainMatchId(2, 0), "A")
    bracket = win(bracket, mainMatchId(2, 1), "B")
    bracket = win(bracket, mainMatchId(3, 0), "A")

    const change = recordWinner(bracket, mainMatchId(1, 0), "H")
    expect(change.cleared.sort()).toEqual(
      [mainMatchId(2, 0), mainMatchId(3, 0)].sort()
    )
    expect(change.bracket.results[mainMatchId(2, 1)]).toBeDefined()
  })

  it("re-recording the same winner clears nothing", () => {
    let bracket = draw(["A", "B", "C", "D"])
    bracket = win(bracket, mainMatchId(1, 0), "A")
    bracket = win(bracket, mainMatchId(1, 1), "B")
    bracket = win(bracket, mainMatchId(2, 0), "B")
    expect(recordWinner(bracket, mainMatchId(1, 0), "A").cleared).toEqual([])
  })
})

describe("clearResult", () => {
  it("removes the result and everything that depended on it", () => {
    let bracket = draw(["A", "B", "C", "D"])
    bracket = win(bracket, mainMatchId(1, 0), "A")
    bracket = win(bracket, mainMatchId(1, 1), "B")
    bracket = win(bracket, mainMatchId(2, 0), "B")

    const change = clearResult(bracket, mainMatchId(1, 1))
    expect(change.cleared).toEqual([mainMatchId(2, 0)])
    expect(Object.keys(change.bracket.results)).toEqual([mainMatchId(1, 0)])
    expect(getMatch(change.bracket, mainMatchId(2, 0)).status).toBe("waiting")
  })
})

describe("swapEntries", () => {
  it("swaps first-round slots, including byes", () => {
    const bracket = draw(["A", "B", "C"])
    // entries: A, null, B, C
    const swapped = swapEntries(bracket, 1, 3)
    expect(swapped.entries).toEqual(["A", "C", "B", null])
    expect(bracket.entries).toEqual(["A", null, "B", "C"])
  })

  it("is blocked once a result exists", () => {
    const bracket = win(draw(["A", "B", "C", "D"]), mainMatchId(1, 0), "A")
    expect(() => swapEntries(bracket, 0, 1)).toThrow(/already has results/)
  })

  it("rejects invalid indexes", () => {
    expect(() => swapEntries(draw(["A", "B"]), 0, 5)).toThrow(RangeError)
  })
})

describe("getPlacements", () => {
  it("awards two bronzes to the semifinal losers by default", () => {
    let bracket = draw(["A", "B", "C", "D"])
    bracket = win(bracket, mainMatchId(1, 0), "A")
    bracket = win(bracket, mainMatchId(1, 1), "B")
    bracket = win(bracket, mainMatchId(2, 0), "A")
    expect(getPlacements(bracket)).toEqual({
      gold: "A",
      silver: "B",
      bronze: ["D", "C"],
    })
  })

  it("awards one bronze to the 3rd-place match winner when enabled", () => {
    let bracket = draw(["A", "B", "C", "D"], true)
    bracket = win(bracket, mainMatchId(1, 0), "A")
    bracket = win(bracket, mainMatchId(1, 1), "B")
    expect(getMatch(bracket, mainMatchId(1, 0)).loserTo).toEqual({
      matchId: THIRD_PLACE_MATCH_ID,
      slot: 0,
    })
    bracket = win(bracket, THIRD_PLACE_MATCH_ID, "C")
    bracket = win(bracket, mainMatchId(2, 0), "B")
    expect(getPlacements(bracket)).toEqual({
      gold: "B",
      silver: "A",
      bronze: ["C"],
    })
  })

  it("gives the lone semifinal loser bronze when the other semi was a bye", () => {
    let bracket = draw(["A", "B", "C"], true)
    // A has a bye; B vs C in the other semi.
    bracket = win(bracket, mainMatchId(1, 1), "C")
    expect(getMatch(bracket, THIRD_PLACE_MATCH_ID).status).toBe("bye")
    expect(getPlacements(bracket).bronze).toEqual(["B"])
  })

  it("has no bronze in a 2-athlete bracket", () => {
    const bracket = win(draw(["A", "B"]), mainMatchId(1, 0), "B")
    expect(getPlacements(bracket)).toEqual({
      gold: "B",
      silver: "A",
      bronze: [],
    })
  })
})
