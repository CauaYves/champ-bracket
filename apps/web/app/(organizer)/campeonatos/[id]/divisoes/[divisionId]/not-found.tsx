"use client"

import { useParams } from "next/navigation"

import { NotFoundState } from "@/components/not-found-state"

// not-found.tsx receives no params; read the championship id from the URL.
export default function DivisionNotFound() {
  const { id } = useParams<{ id: string }>()

  return (
    <NotFoundState
      title="Divisão não encontrada"
      description="Esta divisão não existe mais. Ela pode ter sido excluída."
      href={`/campeonatos/${id}`}
      action="Voltar ao campeonato"
    />
  )
}
