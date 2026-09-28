"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"
import { startTransition, useActionState, useState } from "react"

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
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@workspace/ui/components/input-group"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

import { DecimalInput } from "@/components/formatted-inputs"
import type { Criteria } from "@/lib/criteria"
import { formatDecimalInput } from "@/lib/format"
import { fieldError, type FormState } from "@/lib/form-state"

import { savePreset } from "./actions"

type CategoryRow = {
  key: number
  name: string
  minAge: string
  maxAge: string
}

let nextKey = 0

/** Whole ages, up to 2 digits. */
function ageDigits(value: string) {
  return formatDecimalInput(value, { decimals: 0, integerDigits: 2 })
}

function toRows(criteria: Criteria): CategoryRow[] {
  return criteria.ageCategories.map((category) => ({
    key: nextKey++,
    name: category.name,
    minAge: String(category.minAge),
    maxAge: category.maxAge === null ? "" : String(category.maxAge),
  }))
}

export function PresetForm({
  presetId,
  name,
  criteria,
}: {
  presetId: string | null
  name: string
  criteria: Criteria
}) {
  const [state, action, pending] = useActionState(
    savePreset.bind(null, presetId),
    {} as FormState
  )
  const [rows, setRows] = useState(() => toRows(criteria))
  const invalid = (field: string) => !!state.fieldErrors?.[field]

  function updateRow(key: number, patch: Partial<CategoryRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {presetId ? "Editar modalidade" : "Nova modalidade"}
        </CardTitle>
        <CardDescription>
          Alterações valem para novos campeonatos. Campeonatos já criados
          guardam a configuração da época.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            startTransition(() => action(formData))
          }}
        >
          <FieldGroup>
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={invalid("name")}>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={name}
                required
                aria-invalid={invalid("name")}
              />
              <FieldError errors={fieldError(state, "name")} />
            </Field>
            <Field data-invalid={invalid("adultAge")}>
              <FieldLabel htmlFor="adultAge">Maioridade</FieldLabel>
              <DecimalInput
                id="adultAge"
                name="adultAge"
                unit="anos"
                decimals={0}
                integerDigits={2}
                defaultValue={String(criteria.adultAge)}
                required
                aria-invalid={invalid("adultAge")}
              />
              <FieldDescription>
                Abaixo desta idade a inscrição exige os dados e a autorização do
                responsável.
              </FieldDescription>
              <FieldError errors={fieldError(state, "adultAge")} />
            </Field>
            <Field data-invalid={invalid("belts")}>
              <FieldLabel htmlFor="belts">Faixas / graduações</FieldLabel>
              <Textarea
                id="belts"
                name="belts"
                rows={6}
                defaultValue={criteria.belts.join("\n")}
                required
                aria-invalid={invalid("belts")}
              />
              <FieldDescription>
                Uma por linha, da menor para a maior.
              </FieldDescription>
              <FieldError errors={fieldError(state, "belts")} />
            </Field>
            <FieldSet data-invalid={invalid("ageCategories")}>
              <FieldLegend>Categorias de idade</FieldLegend>
              <FieldDescription>
                Idade pelo ano de nascimento. Deixe a idade máxima vazia para
                &quot;sem limite&quot;.
              </FieldDescription>
              <FieldGroup>
                {rows.map((row, index) => (
                  <Field key={row.key} orientation="horizontal">
                    <FieldLabel
                      htmlFor={`category-name-${row.key}`}
                      className="sr-only"
                    >
                      Categoria {index + 1}
                    </FieldLabel>
                    <Input
                      id={`category-name-${row.key}`}
                      name="categoryName"
                      placeholder="Nome"
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.key, { name: e.target.value })
                      }
                      required
                    />
                    <InputGroup>
                      <InputGroupInput
                        name="categoryMin"
                        inputMode="numeric"
                        placeholder="Mín."
                        aria-label={`Idade mínima da categoria ${index + 1}`}
                        value={row.minAge}
                        onChange={(e) =>
                          updateRow(row.key, {
                            minAge: ageDigits(e.target.value),
                          })
                        }
                        required
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>anos</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <InputGroup>
                      <InputGroupInput
                        name="categoryMax"
                        inputMode="numeric"
                        placeholder="Máx."
                        aria-label={`Idade máxima da categoria ${index + 1}`}
                        value={row.maxAge}
                        onChange={(e) =>
                          updateRow(row.key, {
                            maxAge: ageDigits(e.target.value),
                          })
                        }
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>anos</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover categoria ${index + 1}`}
                      disabled={rows.length === 1}
                      onClick={() =>
                        setRows((current) =>
                          current.filter((r) => r.key !== row.key)
                        )
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </Field>
                ))}
              </FieldGroup>
              <FieldError errors={fieldError(state, "ageCategories")} />
              <Field orientation="horizontal">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setRows((current) => [
                      ...current,
                      { key: nextKey++, name: "", minAge: "", maxAge: "" },
                    ])
                  }
                >
                  <PlusIcon data-icon="inline-start" />
                  Adicionar categoria
                </Button>
              </Field>
            </FieldSet>
            <Field orientation="horizontal">
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Salvar modalidade
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
