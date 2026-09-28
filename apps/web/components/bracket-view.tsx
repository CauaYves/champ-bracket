"use client"

import {
  getMatches,
  totalRounds,
  type Match,
  type SingleEliminationBracket,
  type Slot,
} from "@workspace/bracket-engine"
import { Undo2Icon } from "lucide-react"
import { useState, useTransition } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@workspace/ui/components/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/item"
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area"

import { notify } from "@/components/action-button"
import { AthletePopover } from "@/components/athlete-popover"
import { matchLabel, roundLabel, type AthleteMap } from "@/lib/bracket"

type Result = { error?: string; message?: string; confirm?: string[] }

type BracketViewProps = {
  bracket: SingleEliminationBracket
  athletes: AthleteMap
} & (
  | { mode: "view" }
  | { mode: "arrange"; onSwap: (from: number, to: number) => Promise<Result> }
  | {
      mode: "score"
      onRecord: (
        matchId: string,
        winnerId: string,
        confirmed: boolean
      ) => Promise<Result>
      onUndo: (matchId: string, confirmed: boolean) => Promise<Result>
    }
)

export function BracketView(props: BracketViewProps) {
  const { bracket, athletes } = props
  const [pending, startTransition] = useTransition()
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [confirmation, setConfirmation] = useState<{
    labels: string[]
    run: () => Promise<Result>
  } | null>(null)

  const matches = getMatches(bracket)
  const rounds = totalRounds(bracket)
  const columns = Array.from({ length: rounds }, (_, i) =>
    matches.filter((m) => m.round === i + 1)
  )

  /** Runs a result change; asks to confirm when later results would be lost. */
  function runResult(attempt: (confirmed: boolean) => Promise<Result>) {
    startTransition(async () => {
      const result = await attempt(false)
      if (result.confirm) {
        setConfirmation({ labels: result.confirm, run: () => attempt(true) })
      } else {
        notify(result)
      }
    })
  }

  function swap(from: number, to: number) {
    if (props.mode !== "arrange" || from === to) return
    setSelectedSlot(null)
    startTransition(async () => notify(await props.onSwap(from, to)))
  }

  function slotActions(match: Match, slotIndex: 0 | 1) {
    const slot = match.slots[slotIndex]

    if (props.mode === "arrange" && match.round === 1) {
      const index = match.position * 2 + slotIndex
      if (selectedSlot === null) {
        return slot.type === "athlete" ? (
          <Button
            size="xs"
            variant="ghost"
            disabled={pending}
            onClick={() => setSelectedSlot(index)}
          >
            Trocar
          </Button>
        ) : null
      }
      return (
        <Button
          size="xs"
          variant={selectedSlot === index ? "secondary" : "outline"}
          disabled={pending}
          onClick={() =>
            selectedSlot === index
              ? setSelectedSlot(null)
              : swap(selectedSlot, index)
          }
        >
          {selectedSlot === index ? "Cancelar" : "Trocar aqui"}
        </Button>
      )
    }

    if (slot.type !== "athlete") return null
    if (match.winnerId === slot.athleteId) return <Badge>Vencedor</Badge>
    if (
      props.mode === "score" &&
      (match.status === "ready" || match.status === "done")
    ) {
      const { onRecord } = props
      return (
        <Button
          size="xs"
          variant="outline"
          disabled={pending}
          onClick={() =>
            runResult((confirmed) =>
              onRecord(match.id, slot.athleteId, confirmed)
            )
          }
        >
          Venceu
        </Button>
      )
    }
    return null
  }

  function renderSlot(match: Match, slotIndex: 0 | 1) {
    const slot: Slot = match.slots[slotIndex]
    const index = match.position * 2 + slotIndex
    const draggable = props.mode === "arrange" && match.round === 1

    return (
      <Item
        key={slotIndex}
        size="xs"
        variant={slot.type === "athlete" ? "outline" : "muted"}
        draggable={draggable && slot.type === "athlete"}
        onDragStart={(event) =>
          event.dataTransfer.setData("text/plain", String(index))
        }
        onDragOver={draggable ? (event) => event.preventDefault() : undefined}
        onDrop={
          draggable
            ? (event) => {
                event.preventDefault()
                swap(Number(event.dataTransfer.getData("text/plain")), index)
              }
            : undefined
        }
      >
        {slot.type === "athlete" ? (
          <AthletePopover
            athleteId={slot.athleteId}
            athletes={athletes}
            matches={matches}
            totalRounds={rounds}
          >
            <ItemContent
              aria-label={`Ver informações de ${athletes[slot.athleteId]?.name ?? "atleta"}`}
            >
              <ItemTitle>
                {athletes[slot.athleteId]?.name ?? "Atleta"}
              </ItemTitle>
              <ItemDescription>
                {athletes[slot.athleteId]?.academy}
              </ItemDescription>
            </ItemContent>
          </AthletePopover>
        ) : (
          <ItemContent>
            <ItemDescription>
              {slot.type === "bye" ? "Sem adversário" : "A definir"}
            </ItemDescription>
          </ItemContent>
        )}
        <ItemActions>{slotActions(match, slotIndex)}</ItemActions>
      </Item>
    )
  }

  function renderMatch(match: Match) {
    return (
      <Card key={match.id} size="sm">
        <CardHeader>
          <CardDescription>{matchLabel(match, rounds)}</CardDescription>
          {props.mode === "score" && match.status === "done" && (
            <CardAction>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Desfazer resultado"
                disabled={pending}
                onClick={() => {
                  const { onUndo } = props
                  runResult((confirmed) => onUndo(match.id, confirmed))
                }}
              >
                <Undo2Icon />
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <ItemGroup>{[renderSlot(match, 0), renderSlot(match, 1)]}</ItemGroup>
        </CardContent>
      </Card>
    )
  }

  const thirdPlace = matches.find((m) => m.stage === "third_place")

  return (
    <>
      <ScrollArea>
        <div className="flex gap-6 pb-4">
          {columns.map((column, i) => (
            <div
              key={i}
              className="flex w-72 shrink-0 flex-col justify-around gap-4"
            >
              <Badge variant="outline">{roundLabel(i + 1, rounds)}</Badge>
              {column.filter((m) => m.stage === "main").map(renderMatch)}
              {i === rounds - 1 && thirdPlace && renderMatch(thirdPlace)}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar este resultado?</AlertDialogTitle>
            <AlertDialogDescription>
              Os resultados destas lutas serão apagados porque os lutadores
              mudam: {confirmation?.labels.join(", ")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const run = confirmation?.run
                setConfirmation(null)
                if (run) startTransition(async () => notify(await run()))
              }}
            >
              Alterar e apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
