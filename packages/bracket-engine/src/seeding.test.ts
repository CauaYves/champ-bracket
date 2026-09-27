import { describe, expect, it } from "vitest"

import { competitionAge, isMinor } from "./age"
import { nextPowerOfTwo, seedOrder } from "./seeding"

describe("seedOrder", () => {
  it("returns the standard order", () => {
    expect(seedOrder(1)).toEqual([1])
    expect(seedOrder(2)).toEqual([1, 2])
    expect(seedOrder(4)).toEqual([1, 4, 2, 3])
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
  })

  it("rejects sizes that are not powers of 2", () => {
    expect(() => seedOrder(6)).toThrow(RangeError)
    expect(() => seedOrder(0)).toThrow(RangeError)
  })
})

describe("nextPowerOfTwo", () => {
  it("rounds up", () => {
    expect([1, 2, 3, 5, 9, 16, 17].map(nextPowerOfTwo)).toEqual([
      1, 2, 4, 8, 16, 16, 32,
    ])
  })
})

describe("competitionAge", () => {
  it("uses the birth year only", () => {
    expect(competitionAge("2010-12-31", 2026)).toBe(16)
    expect(competitionAge("2010-01-01", 2026)).toBe(16)
  })

  it("flags minors", () => {
    expect(isMinor("2009-06-15", 2026)).toBe(true)
    expect(isMinor("2008-12-31", 2026)).toBe(false)
  })

  it("rejects invalid dates", () => {
    expect(() => competitionAge("abc", 2026)).toThrow(RangeError)
  })
})
