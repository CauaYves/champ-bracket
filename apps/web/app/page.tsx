import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { getUserId } from "@/lib/supabase/server"

export default async function HomePage() {
  if (await getUserId()) redirect("/campeonatos")

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fight Bracket</CardTitle>
          <CardDescription>
            Inscrições por QR Code, categorias e chaves de campeonatos de artes
            marciais montadas automaticamente.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button render={<Link href="/cadastro" />} nativeButton={false}>
            Criar conta
          </Button>
          <Button
            variant="outline"
            render={<Link href="/entrar" />}
            nativeButton={false}
          >
            Entrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
