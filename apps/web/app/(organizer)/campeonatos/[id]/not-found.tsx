import { NotFoundState } from "@/components/not-found-state"

export default function ChampionshipNotFound() {
  return (
    <NotFoundState
      title="Campeonato não encontrado"
      description="Este campeonato não existe ou não pertence à sua conta."
      href="/campeonatos"
      action="Ver meus campeonatos"
    />
  )
}
