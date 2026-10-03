import { NotFoundState } from "@/components/not-found-state"

export default function PublicChampionshipNotFound() {
  return (
    <NotFoundState
      title="Campeonato não encontrado"
      description="Confira o link ou o QR Code com o organizador do campeonato."
      href="/"
      action="Ir para o início"
    />
  )
}
