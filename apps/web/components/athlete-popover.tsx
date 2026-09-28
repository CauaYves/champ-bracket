"use client"

import type { AthleteId, Match } from "@workspace/bracket-engine"

import { Badge } from "@workspace/ui/components/badge"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/item"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Separator } from "@workspace/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@workspace/ui/components/table"

import { matchLabel, type AthleteMap } from "@/lib/bracket"

function outcome(match: Match, athleteId: AthleteId) {
  if (match.status === "bye") return "Avançou sem luta"
  if (match.winnerId === athleteId) return "Venceu"
  if (match.loserId === athleteId) return "Perdeu"
  return "Aguardando"
}

function opponentOf(match: Match, athleteId: AthleteId, athletes: AthleteMap) {
  const other = match.slots.find(
    (slot) => !(slot.type === "athlete" && slot.athleteId === athleteId)
  )
  if (!other || other.type === "bye") return "Sem adversário"
  if (other.type === "pending") return "Adversário a definir"
  return `vs ${athletes[other.athleteId]?.name ?? "Atleta"}`
}

/**
 * Clickable athlete name in the bracket. Opens the athlete's details (when
 * provided — organizer only) and their fights in this bracket.
 */
export function AthletePopover({
  athleteId,
  athletes,
  matches,
  totalRounds,
  children,
}: {
  athleteId: AthleteId
  athletes: AthleteMap
  matches: Match[]
  totalRounds: number
  /** The trigger element (the athlete's name block). */
  children: React.ReactElement
}) {
  const athlete = athletes[athleteId]
  const fights = matches.filter((match) =>
    match.slots.some(
      (slot) => slot.type === "athlete" && slot.athleteId === athleteId
    )
  )

  return (
    <Popover>
      <PopoverTrigger render={children} nativeButton={false} />
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>{athlete?.name ?? "Atleta"}</PopoverTitle>
          <PopoverDescription>{athlete?.academy}</PopoverDescription>
        </PopoverHeader>

        {athlete?.details && athlete.details.length > 0 && (
          <Table>
            <TableBody>
              {athlete.details.map((row) => (
                <TableRow key={row.label}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Separator />
        <ItemGroup>
          {fights.map((match) => (
            <Item key={match.id} size="xs">
              <ItemContent>
                <ItemTitle>{matchLabel(match, totalRounds)}</ItemTitle>
                <ItemDescription>
                  {opponentOf(match, athleteId, athletes)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge
                  variant={
                    outcome(match, athleteId) === "Venceu"
                      ? "default"
                      : "secondary"
                  }
                >
                  {outcome(match, athleteId)}
                </Badge>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </PopoverContent>
    </Popover>
  )
}
