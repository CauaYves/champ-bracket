/**
 * Competition age by birth year: championship year − birth year,
 * regardless of the athlete's birthday.
 *
 * @param birthDate ISO date (`YYYY-MM-DD`)
 */
export function competitionAge(birthDate: string, championshipYear: number) {
  const birthYear = Number(birthDate.slice(0, 4))
  if (!Number.isInteger(birthYear) || birthDate.length < 4) {
    throw new RangeError(`Invalid birth date: ${birthDate}`)
  }
  return championshipYear - birthYear
}

export function isMinor(
  birthDate: string,
  championshipYear: number,
  adultAge = 18
) {
  return competitionAge(birthDate, championshipYear) < adultAge
}
