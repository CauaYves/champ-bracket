"use client"

import { useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Switch } from "@workspace/ui/components/switch"

import { notify } from "@/components/action-button"

import type { ActionResult } from "../actions"

export function ThirdPlaceSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: (enabled: boolean) => Promise<ActionResult>
}) {
  const [pending, startTransition] = useTransition()

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="third-place">Disputa de 3º lugar</FieldLabel>
        <FieldDescription>
          Desligado: os dois perdedores das semifinais ganham bronze. Ligado:
          eles lutam por um único bronze. Vale para chaves com semifinal.
        </FieldDescription>
      </FieldContent>
      <Switch
        id="third-place"
        checked={checked}
        disabled={disabled || pending}
        onCheckedChange={(enabled) =>
          startTransition(async () => notify(await onChange(enabled)))
        }
      />
    </Field>
  )
}

export function MoveAthlete({
  athleteName,
  divisions,
  onMove,
}: {
  athleteName: string
  divisions: { id: string; name: string }[]
  onMove: (toDivisionId: string | null) => Promise<ActionResult>
}) {
  const [target, setTarget] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Field orientation="horizontal">
      <NativeSelect
        aria-label={`Mover ${athleteName} para`}
        value={target}
        onChange={(event) => setTarget(event.target.value)}
        disabled={pending}
      >
        <NativeSelectOption value="" disabled>
          Mover para…
        </NativeSelectOption>
        {divisions.map((division) => (
          <NativeSelectOption key={division.id} value={division.id}>
            {division.name}
          </NativeSelectOption>
        ))}
        <NativeSelectOption value="none">Sem divisão</NativeSelectOption>
      </NativeSelect>
      <Button
        variant="outline"
        disabled={!target || pending}
        onClick={() =>
          startTransition(async () =>
            notify(await onMove(target === "none" ? null : target))
          )
        }
      >
        Mover
      </Button>
    </Field>
  )
}
