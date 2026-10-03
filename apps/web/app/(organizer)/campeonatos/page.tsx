import { ChevronRightIcon, PlusIcon, TrophyIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/item"

import { championshipStatusLabel, formatDate } from "@/lib/labels"
import { createClient } from "@/lib/supabase/server"

function NewChampionshipButton() {
  return (
    <Button render={<Link href="/campeonatos/novo" />} nativeButton={false}>
      <PlusIcon data-icon="inline-start" />
      Novo campeonato
    </Button>
  )
}

export default async function ChampionshipsPage() {
  const supabase = await createClient()
  const { data: championships } = await supabase
    .from("championships")
    .select("id, name, event_date, location, status")
    .order("event_date", { ascending: false })

  if (!championships?.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrophyIcon />
          </EmptyMedia>
          <EmptyTitle>Nenhum campeonato ainda</EmptyTitle>
          <EmptyDescription>
            Crie seu primeiro campeonato para abrir as inscrições.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewChampionshipButton />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campeonatos</CardTitle>
        <CardDescription>
          Seus campeonatos, do mais recente ao mais antigo.
        </CardDescription>
        <CardAction>
          <NewChampionshipButton />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {championships.map((championship) => (
            <Item
              key={championship.id}
              variant="outline"
              render={<Link href={`/campeonatos/${championship.id}`} />}
            >
              <ItemContent>
                <ItemTitle>{championship.name}</ItemTitle>
                <ItemDescription>
                  {formatDate(championship.event_date)} ·{" "}
                  {championship.location}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary">
                  {championshipStatusLabel[championship.status]}
                </Badge>
                <ChevronRightIcon />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
