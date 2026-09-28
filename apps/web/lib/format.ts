/** Keeps only digits. */
export function digitsOnly(value: string) {
  return value.replace(/\D/g, "")
}

/**
 * Brazilian phone mask, applied progressively while typing:
 * `(24) 99999-9999` (mobile, 11 digits) or `(24) 3333-4444` (landline, 10).
 */
export function formatPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  const area = digits.slice(0, 2)
  const rest = digits.slice(2)
  if (rest.length <= 4) return `(${area}) ${rest}`
  const split = digits.length === 11 ? 5 : 4
  return `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`
}

/**
 * Decimal input in pt-BR notation while typing: digits and a single comma,
 * limited to `integerDigits` before and `decimals` after it. A dot is
 * accepted and turned into a comma.
 */
export function formatDecimalInput(
  value: string,
  { integerDigits = 3, decimals = 1 } = {}
) {
  const cleaned = value.replace(/\./g, ",").replace(/[^\d,]/g, "")
  const [integer = "", ...fraction] = cleaned.split(",")
  const int = integer.slice(0, integerDigits)
  if (fraction.length === 0 || decimals === 0) return int
  return `${int},${fraction.join("").slice(0, decimals)}`
}

/** Parses a pt-BR decimal (`72,5`) into a number. */
export function parseDecimal(value: string) {
  return Number(value.replace(",", "."))
}

const weightFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
})

export function formatWeight(kg: number) {
  return `${weightFormat.format(kg)} kg`
}
