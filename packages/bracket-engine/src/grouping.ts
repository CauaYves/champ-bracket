import { competitionAge } from "./age"
import type { AthleteId } from "./types"

export type Gender = "male" | "female"

export interface AgeCategory {
  name: string
  minAge: number
  /** `null` = no upper limit. */
  maxAge: number | null
}

export interface GroupingCriteria {
  /** Ordered from lowest to highest rank. */
  belts: string[]
  ageCategories: AgeCategory[]
}

export interface GroupingAthlete {
  id: AthleteId
  gender: Gender
  /** ISO date (`YYYY-MM-DD`). */
  birthDate: string
  belt: string
}

export interface DivisionGroup {
  /** Stable identity of the criteria combination, e.g. `male|Adulto|Azul`. */
  key: string
  gender: Gender
  /** `null` when the athlete's age fits no category. */
  ageCategory: string | null
  belt: string
  athleteIds: AthleteId[]
}

export function findAgeCategory(
  categories: readonly AgeCategory[],
  age: number
): AgeCategory | null {
  return (
    categories.find(
      (c) => age >= c.minAge && (c.maxAge === null || age <= c.maxAge)
    ) ?? null
  )
}

const GENDER_ORDER: Gender[] = ["female", "male"]

/**
 * Splits athletes into divisions by gender, age category (by birth year) and
 * belt. Groups are ordered by gender, then age category order, then belt rank.
 */
export function groupAthletes(
  athletes: readonly GroupingAthlete[],
  criteria: GroupingCriteria,
  eventYear: number
): DivisionGroup[] {
  const groups = new Map<string, DivisionGroup>()

  for (const athlete of athletes) {
    const age = competitionAge(athlete.birthDate, eventYear)
    const ageCategory =
      findAgeCategory(criteria.ageCategories, age)?.name ?? null
    const key = `${athlete.gender}|${ageCategory ?? ""}|${athlete.belt}`

    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        gender: athlete.gender,
        ageCategory,
        belt: athlete.belt,
        athleteIds: [],
      }
      groups.set(key, group)
    }
    group.athleteIds.push(athlete.id)
  }

  const categoryIndex = (name: string | null) => {
    const i = criteria.ageCategories.findIndex((c) => c.name === name)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  const beltIndex = (belt: string) => {
    const i = criteria.belts.indexOf(belt)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }

  return [...groups.values()].sort(
    (a, b) =>
      GENDER_ORDER.indexOf(a.gender) - GENDER_ORDER.indexOf(b.gender) ||
      categoryIndex(a.ageCategory) - categoryIndex(b.ageCategory) ||
      beltIndex(a.belt) - beltIndex(b.belt)
  )
}
