import { NotFoundState } from "@/components/not-found-state"

export default function PresetNotFound() {
  return (
    <NotFoundState
      title="Modalidade não encontrada"
      description="Esta modalidade não existe ou é uma modalidade padrão, que não pode ser editada. Duplique-a para personalizar."
      href="/modalidades"
      action="Ver modalidades"
    />
  )
}
