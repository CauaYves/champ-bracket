import { describe, expect, it } from "vitest"

import {
  findAgeCategory,
  groupAthletes,
  type GroupingCriteria,
} from "./grouping"

const criteria: GroupingCriteria = {
  belts: ["Branca", "Azul", "Preta"],
  ageCategories: [
    { name: "Infantil", minAge: 8, maxAge: 11 },
    { name: "Adulto", minAge: 18, maxAge: 32 },
    { name: "Master", minAge: 33, maxAge: null },
  ],
}

describe("findAgeCategory", () => {
  it("matches inclusive ranges and open-ended categories", () => {
    expect(findAgeCategory(criteria.ageCategories, 11)?.name).toBe("Infantil")
    expect(findAgeCategory(criteria.ageCategories, 18)?.name).toBe("Adulto")
    expect(findAgeCategory(criteria.ageCategories, 60)?.name).toBe("Master")
    expect(findAgeCategory(criteria.ageCategories, 14)).toBeNull()
  })
})

describe("groupAthletes", () => {
  it("groups by gender, age category (birth year) and belt", () => {
    const groups = groupAthletes(
      [
        { id: "a", gender: "male", birthDate: "2004-12-31", belt: "Azul" },
        { id: "b", gender: "male", birthDate: "2004-01-01", belt: "Azul" },
        { id: "c", gender: "male", birthDate: "2004-06-01", belt: "Preta" },
        { id: "d", gender: "female", birthDate: "2004-06-01", belt: "Azul" },
        { id: "e", gender: "male", birthDate: "2016-06-01", belt: "Branca" },
      ],
      criteria,
      2026
    )

    expect(groups.map((g) => [g.key, g.athleteIds])).toEqual([
      ["female|Adulto|Azul", ["d"]],
      ["male|Infantil|Branca", ["e"]],
      ["male|Adulto|Azul", ["a", "b"]],
      ["male|Adulto|Preta", ["c"]],
    ])
  })

  it("puts athletes outside every age category in their own group", () => {
    const [group] = groupAthletes(
      [{ id: "a", gender: "male", birthDate: "2012-01-01", belt: "Azul" }],
      criteria,
      2026
    )
    expect(group).toMatchObject({ ageCategory: null, key: "male||Azul" })
  })
})
