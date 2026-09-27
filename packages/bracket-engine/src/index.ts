export * from "./types"
export { competitionAge, isMinor } from "./age"
export { nextPowerOfTwo, seedOrder, shuffle } from "./seeding"
export {
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
  type CreateSingleEliminationOptions,
  type ResultChange,
} from "./single-elimination"
