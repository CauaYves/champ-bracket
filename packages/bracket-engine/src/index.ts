export * from "./types"
export { competitionAge, isMinor } from "./age"
export { nextPowerOfTwo, seedOrder, shuffle } from "./seeding"
export {
  MIN_BRACKET_ATHLETES,
  THIRD_PLACE_MATCH_ID,
  clearResult,
  createSingleElimination,
  getMatch,
  getMatches,
  getPlacements,
  isBracketComplete,
  mainMatchId,
  recordWinner,
  swapEntries,
  totalRounds,
  type CreateSingleEliminationOptions,
  type ResultChange,
} from "./single-elimination"
export {
  findAgeCategory,
  groupAthletes,
  type AgeCategory,
  type DivisionGroup,
  type Gender,
  type GroupingAthlete,
  type GroupingCriteria,
} from "./grouping"
export {
  canHaveFights,
  isChampionshipComplete,
  nextChampionshipStatus,
  type ChampionshipStatus,
  type DivisionProgress,
  type DivisionStatus,
} from "./championship"
