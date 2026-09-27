import type { Enums } from "@/lib/supabase/database.types"

export const championshipStatusLabel: Record<
  Enums<"championship_status">,
  string
> = {
  draft: "Rascunho",
  registration_open: "Inscrições abertas",
  registration_closed: "Inscrições encerradas",
  in_progress: "Em andamento",
  finished: "Finalizado",
}

export const registrationStatusLabel: Record<
  Enums<"registration_status">,
  string
> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Recusada",
}

export const genderLabel: Record<Enums<"gender">, string> = {
  male: "Masculino",
  female: "Feminino",
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" })

/** Formats a `YYYY-MM-DD` date column. */
export function formatDate(date: string) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`))
}
