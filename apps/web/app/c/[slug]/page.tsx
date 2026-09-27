import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

import { championshipStatusLabel, formatDate } from "@/lib/labels"

import { getPublicChampionship } from "./data"

export default async function PublicChampionshipPage({
  params,
}: PageProps<"/c/[slug]">) {
  const { slug } = await params
  const championship = await getPublicChampionship(slug)
  if (!championship) notFound()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{championship.name}</CardTitle>
          <CardDescription>
            {formatDate(championship.event_date)} · {championship.location}
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {championshipStatusLabel[championship.status]}
            </Badge>
          </CardAction>
        </CardHeader>
        {championship.status === "registration_open" && (
          <CardFooter>
            <Button
              render={<Link href={`/c/${slug}/inscricao`} />}
              nativeButton={false}
            >
              Fazer inscrição
            </Button>
          </CardFooter>
        )}
      </Card>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Chaves ainda não publicadas</EmptyTitle>
          <EmptyDescription>
            As chaves e os resultados aparecerão aqui quando o organizador
            publicá-los.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  )
}
