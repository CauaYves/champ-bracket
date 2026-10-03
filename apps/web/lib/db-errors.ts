/**
 * Messages for errors raised by our database triggers
 * (`supabase/migrations/20261003000000_bracket_integrity.sql`). These guards
 * catch races the UI can't see, e.g. a bracket drawn in another tab.
 */
const triggerErrors: Record<string, string> = {
  athlete_in_drawn_bracket:
    "Este atleta já está em uma chave sorteada e não pode sair dela.",
  bracket_has_invalid_athletes:
    "Os atletas da divisão mudaram. Recarregue a página e sorteie novamente.",
}

export function dbErrorMessage(error: { message: string }, fallback: string) {
  const code = Object.keys(triggerErrors).find((key) =>
    error.message.includes(key)
  )
  return code ? triggerErrors[code]! : fallback
}
