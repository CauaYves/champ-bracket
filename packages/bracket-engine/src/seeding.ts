export function nextPowerOfTwo(n: number): number {
  let size = 1
  while (size < n) size *= 2
  return size
}

/**
 * Standard bracket seed order for `size` slots (a power of 2), e.g.
 * 8 → [1, 8, 4, 5, 2, 7, 3, 6]. Seed 1 and 2 can only meet in the final,
 * and the highest seeds (the byes) are spread evenly across the bracket.
 */
export function seedOrder(size: number): number[] {
  if (size < 1 || nextPowerOfTwo(size) !== size) {
    throw new RangeError(`Bracket size must be a power of 2, got ${size}`)
  }
  let order = [1]
  for (let current = 2; current <= size; current *= 2) {
    order = order.flatMap((seed) => [seed, current + 1 - seed])
  }
  return order
}

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}
