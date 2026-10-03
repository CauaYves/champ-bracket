import { ChevronRightIcon, InfoIcon } from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/item"

import { ActionButton } from "@/components/action-button"
import { divisionStatusLabel } from "@/lib/labels"
import type { Enums, Tables } from "@/lib/supabase/database.types"

import { CreateDivisionForm } from "./create-division-form"
import { createDivision, generateDivisions } from "./divisoes/actions"

export function DivisionsCard({
  championshipId,
  championshipStatus,
  divisions,
  approved,
}: {
  championshipId: string
  championshipStatus: Enums<"championship_status">
  divisions: Pick<Tables<"divisions">, "id" | "name" | "status">[]
  approved: Pick<Tables<"registrations">, "division_id">[]
}) {
  // Also when finished: adding or fixing a division reopens the championship.
  const canOrganize = [
    "registration_closed",
    "in_progress",
    "finished",
  ].includes(championshipStatus)
  const unassigned = approved.filter((r) => !r.division_id).length
  const countIn = (divisionId: string) =>
    approved.filter((r) => r.division_id === divisionId).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Divisões e chaves</CardTitle>
        <CardDescription>
          Os atletas aprovados são agrupados por sexo, categoria de idade e
          faixa. Abra uma divisão para ajustar os atletas e sortear a chave.
        </CardDescription>
        {canOrganize && (
          <CardAction>
            <ActionButton action={generateDivisions.bind(null, championshipId)}>
              Gerar divisões
            </ActionButton>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!canOrganize && (
          <Alert>
            <InfoIcon />
            <AlertDescription>
              Encerre as inscrições para montar as divisões e sortear as chaves.
            </AlertDescription>
          </Alert>
        )}
        {canOrganize && unassigned > 0 && (
          <Alert>
            <InfoIcon />
            <AlertDescription>
              {unassigned} atleta(s) aprovado(s) sem divisão. Clique em “Gerar
              divisões” para distribuí-los.
            </AlertDescription>
          </Alert>
        )}
        {divisions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nenhuma divisão</EmptyTitle>
              <EmptyDescription>
                As divisões aparecem aqui depois de geradas.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup>
            {divisions.map((division) => (
              <Item
                key={division.id}
                variant="outline"
                render={
                  <Link
                    href={`/campeonatos/${championshipId}/divisoes/${division.id}`}
                  />
                }
              >
                <ItemContent>
                  <ItemTitle>{division.name}</ItemTitle>
                  <ItemDescription>
                    {countIn(division.id)} atleta(s)
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="secondary">
                    {divisionStatusLabel[division.status]}
                  </Badge>
                  <ChevronRightIcon />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
        {canOrganize && (
          <CreateDivisionForm
            onCreate={createDivision.bind(null, championshipId)}
          />
        )}
      </CardContent>
    </Card>
  )
}
