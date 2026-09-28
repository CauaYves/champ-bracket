import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
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

import { BracketView } from "@/components/bracket-view"
import { Podium } from "@/components/podium"
import {
  championshipStatusLabel,
  divisionStatusLabel,
  formatDate,
} from "@/lib/labels"

import { AutoRefresh } from "./auto-refresh"
import { getPublicChampionship, getPublicDivisions } from "./data"

export default async function PublicChampionshipPage({
  params,
}: PageProps<"/c/[slug]">) {
  const { slug } = await params
  const championship = await getPublicChampionship(slug)
  if (!championship) notFound()

  // Draws still being arranged by the organizer stay private.
  const divisions = (await getPublicDivisions(slug)).filter(
    (division) => division.status !== "draft"
  )

  return (
    <>
      {championship.status === "in_progress" && <AutoRefresh seconds={15} />}
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

      {divisions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Chaves ainda não publicadas</EmptyTitle>
            <EmptyDescription>
              As chaves e os resultados aparecerão aqui quando as lutas
              começarem.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        divisions.map((division) => (
          <Card key={division.id}>
            <CardHeader>
              <CardTitle>{division.name}</CardTitle>
              <CardAction>
                <Badge variant="secondary">
                  {divisionStatusLabel[division.status]}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Podium bracket={division.bracket} athletes={division.athletes} />
              <BracketView
                mode="view"
                bracket={division.bracket}
                athletes={division.athletes}
              />
            </CardContent>
          </Card>
        ))
      )}
    </>
  )
}
