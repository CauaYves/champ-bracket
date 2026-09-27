"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"

import { fieldError, type FormState } from "@/lib/form-state"

import { createChampionship } from "../actions"

export function ChampionshipForm({
  presets,
}: {
  presets: { id: string; name: string }[]
}) {
  const [state, action, pending] = useActionState(
    createChampionship,
    {} as FormState
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo campeonato</CardTitle>
        <CardDescription>
          Depois de criar, abra as inscrições e compartilhe o QR Code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup>
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={!!state.fieldErrors?.name}>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                aria-invalid={!!state.fieldErrors?.name}
              />
              <FieldError errors={fieldError(state, "name")} />
            </Field>
            <Field data-invalid={!!state.fieldErrors?.eventDate}>
              <FieldLabel htmlFor="eventDate">Data do evento</FieldLabel>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                required
                aria-invalid={!!state.fieldErrors?.eventDate}
              />
              <FieldDescription>
                A idade dos atletas é calculada pelo ano de nascimento em
                relação ao ano do evento.
              </FieldDescription>
              <FieldError errors={fieldError(state, "eventDate")} />
            </Field>
            <Field data-invalid={!!state.fieldErrors?.location}>
              <FieldLabel htmlFor="location">Local</FieldLabel>
              <Input
                id="location"
                name="location"
                required
                aria-invalid={!!state.fieldErrors?.location}
              />
              <FieldError errors={fieldError(state, "location")} />
            </Field>
            <Field data-invalid={!!state.fieldErrors?.presetId}>
              <FieldLabel htmlFor="presetId">Modalidade</FieldLabel>
              <NativeSelect
                id="presetId"
                name="presetId"
                required
                defaultValue=""
                aria-invalid={!!state.fieldErrors?.presetId}
              >
                <NativeSelectOption value="" disabled>
                  Selecione
                </NativeSelectOption>
                {presets.map((preset) => (
                  <NativeSelectOption key={preset.id} value={preset.id}>
                    {preset.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>
                Define as faixas e categorias de idade do campeonato.{" "}
                <Link href="/modalidades">Gerenciar modalidades</Link>
              </FieldDescription>
              <FieldError errors={fieldError(state, "presetId")} />
            </Field>
            <Field orientation="horizontal">
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Criar campeonato
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
