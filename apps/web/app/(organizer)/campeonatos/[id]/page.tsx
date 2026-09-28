import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { competitionAge } from "@workspace/bracket-engine"
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
  EmptyDescription,
  EmptyHeader,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import {
  championshipStatusLabel,
  formatDate,
  genderLabel,
  registrationStatusLabel,
} from "@/lib/labels"
import type { Enums, Tables } from "@/lib/supabase/database.types"
import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { formatPhone, formatWeight } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

import { setRegistrationStatus, updateChampionshipStatus } from "../actions"
import { DivisionsCard } from "./divisions-card"
import { ShareCard } from "./share-card"

type RegistrationStatus = Enums<"registration_status">

const statusActions: Partial<
  Record<
    Enums<"championship_status">,
    { label: string; to: Enums<"championship_status"> }
  >
> = {
  draft: { label: "Abrir inscrições", to: "registration_open" },
  registration_open: {
    label: "Encerrar inscrições",
    to: "registration_closed",
  },
  registration_closed: { label: "Reabrir inscrições", to: "registration_open" },
}

async function getOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "http"
  return `${proto}://${host}`
}

export default async function ChampionshipPage({
  params,
}: PageProps<"/campeonatos/[id]">) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: championship }, { data: registrations }, { data: divisions }] =
    await Promise.all([
      supabase.from("championships").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("registrations")
        .select("*")
        .eq("championship_id", id)
        .order("created_at"),
      supabase
        .from("divisions")
        .select("id, name, status")
        .eq("championship_id", id)
        .order("name"),
    ])
  if (!championship) notFound()

  const origin = await getOrigin()
  const publicUrl = `${origin}/c/${championship.public_slug}`
  const statusAction = statusActions[championship.status]
  const eventYear = Number(championship.event_date.slice(0, 4))

  const byStatus = (status: RegistrationStatus) =>
    (registrations ?? []).filter((r) => r.status === status)

  return (
    <>
      <PageBreadcrumb
        items={[{ label: "Campeonatos", href: "/campeonatos" }]}
        page={championship.name}
      />
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
        {statusAction && (
          <CardContent>
            <form
              action={updateChampionshipStatus.bind(
                null,
                championship.id,
                statusAction.to
              )}
            >
              <Button type="submit">{statusAction.label}</Button>
            </form>
          </CardContent>
        )}
      </Card>

      {championship.status !== "draft" && (
        <ShareCard
          registrationUrl={`${publicUrl}/inscricao`}
          publicUrl={publicUrl}
        />
      )}

      <DivisionsCard
        championshipId={championship.id}
        championshipStatus={championship.status}
        divisions={divisions ?? []}
        approved={byStatus("approved")}
      />

      <Card>
        <CardHeader>
          <CardTitle>Atletas inscritos</CardTitle>
          <CardDescription>
            Aprove as inscrições para que os atletas entrem nas chaves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              {(["pending", "approved", "rejected"] as const).map((status) => (
                <TabsTrigger key={status} value={status}>
                  {registrationStatusLabel[status]} ({byStatus(status).length})
                </TabsTrigger>
              ))}
            </TabsList>
            {(["pending", "approved", "rejected"] as const).map((status) => (
              <TabsContent key={status} value={status}>
                <RegistrationsTable
                  championshipId={championship.id}
                  registrations={byStatus(status)}
                  eventYear={eventYear}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}

function RegistrationsTable({
  championshipId,
  registrations,
  eventYear,
}: {
  championshipId: string
  registrations: Tables<"registrations">[]
  eventYear: number
}) {
  if (registrations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nenhuma inscrição</EmptyTitle>
          <EmptyDescription>
            As inscrições aparecem aqui assim que os atletas enviarem o
            formulário.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Idade</TableHead>
          <TableHead>Sexo</TableHead>
          <TableHead>Peso</TableHead>
          <TableHead>Faixa</TableHead>
          <TableHead>Academia</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((registration) => (
          <TableRow key={registration.id}>
            <TableCell>{registration.full_name}</TableCell>
            <TableCell>
              {competitionAge(registration.birth_date, eventYear)}
            </TableCell>
            <TableCell>{genderLabel[registration.gender]}</TableCell>
            <TableCell>{formatWeight(registration.weight_kg)}</TableCell>
            <TableCell>{registration.belt}</TableCell>
            <TableCell>{registration.academy}</TableCell>
            <TableCell>
              {formatPhone(registration.phone)}
              {registration.guardian_name && (
                <>
                  {" "}
                  · Resp.: {registration.guardian_name}
                  {registration.guardian_phone &&
                    ` ${formatPhone(registration.guardian_phone)}`}
                </>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                {registration.status !== "approved" && (
                  <form
                    action={setRegistrationStatus.bind(
                      null,
                      championshipId,
                      registration.id,
                      "approved"
                    )}
                  >
                    <Button type="submit" size="sm">
                      Aprovar
                    </Button>
                  </form>
                )}
                {registration.status !== "rejected" && (
                  <form
                    action={setRegistrationStatus.bind(
                      null,
                      championshipId,
                      registration.id,
                      "rejected"
                    )}
                  >
                    <Button type="submit" size="sm" variant="outline">
                      Recusar
                    </Button>
                  </form>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
