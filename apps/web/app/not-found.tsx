import { NotFoundState } from "@/components/not-found-state"

// Unmatched URLs and notFound() calls without a closer not-found.tsx.
export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <NotFoundState
        title="Página não encontrada"
        description="O endereço acessado não existe."
        href="/"
        action="Ir para o início"
      />
    </main>
  )
}
