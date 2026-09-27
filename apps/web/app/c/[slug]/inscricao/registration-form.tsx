"use client"

import Link from "next/link"
import { startTransition, useActionState, useState } from "react"

import { isMinor } from "@workspace/bracket-engine"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Spinner } from "@workspace/ui/components/spinner"

import { fieldError, type FormState } from "@/lib/form-state"
import { genderLabel } from "@/lib/labels"

import { submitRegistration } from "./actions"

export function RegistrationForm({
  slug,
  championshipName,
  eventYear,
  adultAge,
  belts,
}: {
  slug: string
  championshipName: string
  eventYear: number
  adultAge: number
  belts: string[]
}) {
  const [state, action, pending] = useActionState(
    submitRegistration.bind(null, slug),
    {} as FormState
  )
  const [birthDate, setBirthDate] = useState("")
  const minor =
    birthDate.length === 10 && isMinor(birthDate, eventYear, adultAge)
  const invalid = (field: string) => !!state.fieldErrors?.[field]

  if (state.success) {
    return (
      <Alert>
        <AlertTitle>Inscrição enviada!</AlertTitle>
        <AlertDescription>
          <p>
            Sua inscrição em {championshipName} foi recebida e está aguardando a
            aprovação do organizador.
          </p>
          <Button
            variant="link"
            render={<Link href={`/c/${slug}`} />}
            nativeButton={false}
          >
            Ver campeonato
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrição</CardTitle>
        <CardDescription>{championshipName}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* onSubmit + startTransition keeps the typed values if validation fails. */}
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

            <FieldSet>
              <FieldLegend>Atleta</FieldLegend>
              <FieldGroup>
                <Field data-invalid={invalid("fullName")}>
                  <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
                  <Input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    required
                    aria-invalid={invalid("fullName")}
                  />
                  <FieldError errors={fieldError(state, "fullName")} />
                </Field>
                <Field data-invalid={invalid("birthDate")}>
                  <FieldLabel htmlFor="birthDate">
                    Data de nascimento
                  </FieldLabel>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    required
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    aria-invalid={invalid("birthDate")}
                  />
                  <FieldError errors={fieldError(state, "birthDate")} />
                </Field>
                <FieldSet data-invalid={invalid("gender")}>
                  <FieldLegend variant="label">Sexo</FieldLegend>
                  <RadioGroup name="gender" required>
                    {(["male", "female"] as const).map((gender) => (
                      <Field key={gender} orientation="horizontal">
                        <RadioGroupItem
                          value={gender}
                          id={`gender-${gender}`}
                          aria-invalid={invalid("gender")}
                        />
                        <FieldLabel htmlFor={`gender-${gender}`}>
                          {genderLabel[gender]}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                  <FieldError errors={fieldError(state, "gender")} />
                </FieldSet>
                <Field data-invalid={invalid("weightKg")}>
                  <FieldLabel htmlFor="weightKg">Peso (kg)</FieldLabel>
                  <Input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1"
                    max="400"
                    required
                    aria-invalid={invalid("weightKg")}
                  />
                  <FieldError errors={fieldError(state, "weightKg")} />
                </Field>
                <Field data-invalid={invalid("belt")}>
                  <FieldLabel htmlFor="belt">Faixa</FieldLabel>
                  <NativeSelect
                    id="belt"
                    name="belt"
                    required
                    defaultValue=""
                    aria-invalid={invalid("belt")}
                  >
                    <NativeSelectOption value="" disabled>
                      Selecione
                    </NativeSelectOption>
                    {belts.map((belt) => (
                      <NativeSelectOption key={belt} value={belt}>
                        {belt}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError errors={fieldError(state, "belt")} />
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Equipe e contato</FieldLegend>
              <FieldGroup>
                <Field data-invalid={invalid("academy")}>
                  <FieldLabel htmlFor="academy">Academia / equipe</FieldLabel>
                  <Input
                    id="academy"
                    name="academy"
                    required
                    aria-invalid={invalid("academy")}
                  />
                  <FieldError errors={fieldError(state, "academy")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="coach">Professor / técnico</FieldLabel>
                  <Input id="coach" name="coach" />
                </Field>
                <Field data-invalid={invalid("phone")}>
                  <FieldLabel htmlFor="phone">Telefone (WhatsApp)</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    aria-invalid={invalid("phone")}
                  />
                  <FieldError errors={fieldError(state, "phone")} />
                </Field>
                <Field data-invalid={invalid("email")}>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={invalid("email")}
                  />
                  <FieldError errors={fieldError(state, "email")} />
                </Field>
              </FieldGroup>
            </FieldSet>

            {minor && (
              <>
                <FieldSeparator />
                <FieldSet>
                  <FieldLegend>Responsável</FieldLegend>
                  <FieldDescription>
                    O atleta é menor de idade. Os dados e a autorização do
                    responsável são obrigatórios.
                  </FieldDescription>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="guardianName">
                        Nome do responsável
                      </FieldLabel>
                      <Input id="guardianName" name="guardianName" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="guardianPhone">
                        Telefone do responsável
                      </FieldLabel>
                      <Input
                        id="guardianPhone"
                        name="guardianPhone"
                        type="tel"
                        required
                      />
                    </Field>
                    <Field orientation="horizontal">
                      <Checkbox
                        id="guardianConsent"
                        name="guardianConsent"
                        required
                      />
                      <FieldContent>
                        <FieldLabel htmlFor="guardianConsent">
                          Sou o responsável legal e autorizo a participação e o
                          tratamento dos dados do atleta.
                        </FieldLabel>
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </>
            )}

            <FieldSeparator />

            <Field orientation="horizontal" data-invalid={invalid("consent")}>
              <Checkbox
                id="consent"
                name="consent"
                required
                aria-invalid={invalid("consent")}
              />
              <FieldContent>
                <FieldLabel htmlFor="consent">
                  Concordo com o tratamento dos meus dados para a organização do
                  campeonato.
                </FieldLabel>
                <FieldDescription>
                  Seu nome e academia aparecem nas chaves públicas. Contatos são
                  vistos apenas pelo organizador.{" "}
                  <Link href="/privacidade" target="_blank">
                    Aviso de privacidade
                  </Link>
                </FieldDescription>
                <FieldError errors={fieldError(state, "consent")} />
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Enviar inscrição
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
