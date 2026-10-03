import { describe, expect, it } from "vitest"

import {
  isChampionshipComplete,
  nextChampionshipStatus,
  type DivisionProgress,
} from "./championship"

const finished: DivisionProgress = {
  status: "finished",
  hasBracket: true,
  athleteCount: 4,
}
const running: DivisionProgress = {
  status: "in_progress",
  hasBracket: true,
  athleteCount: 4,
}
const drawn: DivisionProgress = {
  status: "draft",
  hasBracket: true,
  athleteCount: 4,
}
const notDrawn: DivisionProgress = {
  status: "draft",
  hasBracket: false,
  athleteCount: 3,
}
const loneAthlete: DivisionProgress = {
  status: "draft",
  hasBracket: false,
  athleteCount: 1,
}
const empty: DivisionProgress = {
  status: "draft",
  hasBracket: false,
  athleteCount: 0,
}

describe("isChampionshipComplete", () => {
  it("is complete when every fightable division is finished", () => {
    expect(isChampionshipComplete([finished], 0)).toBe(true)
    expect(isChampionshipComplete([finished, finished], 0)).toBe(true)
  })

  it("ignores divisions that can never have a fight", () => {
    expect(isChampionshipComplete([finished, loneAthlete, empty], 0)).toBe(true)
  })

  it("is not complete while a division is running or still to be drawn", () => {
    expect(isChampionshipComplete([finished, running], 0)).toBe(false)
    expect(isChampionshipComplete([finished, drawn], 0)).toBe(false)
    expect(isChampionshipComplete([finished, notDrawn], 0)).toBe(false)
  })

  it("is not complete with approved athletes outside divisions", () => {
    expect(isChampionshipComplete([finished], 2)).toBe(false)
  })

  it("is not complete without any fightable division", () => {
    expect(isChampionshipComplete([], 0)).toBe(false)
    expect(isChampionshipComplete([loneAthlete], 0)).toBe(false)
  })
})

describe("nextChampionshipStatus", () => {
  it("starts the event when the first division starts", () => {
    expect(nextChampionshipStatus("registration_closed", [drawn], 0)).toBe(null)
    expect(
      nextChampionshipStatus("registration_closed", [running, drawn], 0)
    ).toBe("in_progress")
  })

  it("finishes and reopens with the divisions", () => {
    expect(nextChampionshipStatus("in_progress", [finished], 0)).toBe(
      "finished"
    )
    expect(nextChampionshipStatus("in_progress", [running], 0)).toBeNull()
    expect(nextChampionshipStatus("finished", [running], 0)).toBe("in_progress")
    expect(nextChampionshipStatus("finished", [finished], 1)).toBe(
      "in_progress"
    )
    expect(nextChampionshipStatus("finished", [finished], 0)).toBeNull()
  })

  it("never touches draft or open registration", () => {
    expect(nextChampionshipStatus("draft", [finished], 0)).toBeNull()
    expect(nextChampionshipStatus("registration_open", [running], 0)).toBeNull()
  })
})
