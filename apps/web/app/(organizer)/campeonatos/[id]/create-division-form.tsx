"use client"

import { PlusIcon } from "lucide-react"
import { useState, useTransition } from "react"

import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"

import { notify } from "@/components/action-button"

import type { ActionResult } from "./divisoes/actions"

export function CreateDivisionForm({
  onCreate,
}: {
  onCreate: (name: string) => Promise<ActionResult>
}) {
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await onCreate(name)
          notify(result)
          if (!result.error) setName("")
        })
      }}
    >
      <Field>
        <FieldLabel htmlFor="division-name">Nova divisão manual</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="division-name"
            placeholder="Ex.: Masculino · Adulto · Faixa Azul · até 75 kg"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" disabled={pending || !name.trim()}>
              <PlusIcon data-icon="inline-start" />
              Criar
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </form>
  )
}
