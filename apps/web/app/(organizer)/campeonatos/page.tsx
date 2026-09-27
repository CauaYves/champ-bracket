import { PlusIcon, TrophyIcon } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {championships.map((championship) => (
              <TableRow key={championship.id}>
                <TableCell>
                  <Link href={`/campeonatos/${championship.id}`}>
                    {championship.name}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(championship.event_date)}</TableCell>
                <TableCell>{championship.location}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {championshipStatusLabel[championship.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
