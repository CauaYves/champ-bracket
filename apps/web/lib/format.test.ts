import { describe, expect, it } from "vitest"

import {
  formatDecimalInput,
  formatPhone,
  formatWeight,
  parseDecimal,
} from "./format"

describe("formatPhone", () => {
  it("masks progressively while typing", () => {
    expect(formatPhone("2")).toBe("(2")
    expect(formatPhone("249")).toBe("(24) 9")
    expect(formatPhone("2499999")).toBe("(24) 9999-9")
    expect(formatPhone("24999999999")).toBe("(24) 99999-9999")
    expect(formatPhone("2433334444")).toBe("(24) 3333-4444")
  })

  it("ignores non-digits and extra digits", () => {
    expect(formatPhone("+55 (24) 99999-9999")).toBe("(55) 24999-9999")
    expect(formatPhone("(24) 99999-99999")).toBe("(24) 99999-9999")
    expect(formatPhone("")).toBe("")
  })
})

describe("formatDecimalInput", () => {
  it("keeps one comma and limits digits", () => {
    expect(formatDecimalInput("72.55")).toBe("72,5")
    expect(formatDecimalInput("1234")).toBe("123")
    expect(formatDecimalInput("7a2,,5")).toBe("72,5")
    expect(formatDecimalInput("18,5", { decimals: 0 })).toBe("18")
  })
})

describe("parseDecimal / formatWeight", () => {
  it("round-trips pt-BR decimals", () => {
    expect(parseDecimal("72,5")).toBe(72.5)
    expect(formatWeight(72.8)).toBe("72,8 kg")
    expect(formatWeight(75)).toBe("75 kg")
  })
})
