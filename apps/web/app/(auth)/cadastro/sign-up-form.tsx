"use client"

import Link from "next/link"
import { useActionState } from "react"

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

import { fieldError, type FormState } from "@/lib/form-state"

import { signUp } from "../actions"

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, {} as FormState)

  if (state.success) {
    return (
      <Alert>
        <AlertTitle>Confirme seu e-mail</AlertTitle>
        <AlertDescription>
          Enviamos um link de confirmação. Abra-o para ativar sua conta.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Organize seus campeonatos e chaves automaticamente.
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
            <Field data-invalid={!!state.fieldErrors?.fullName}>
              <FieldLabel htmlFor="fullName">Nome</FieldLabel>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                aria-invalid={!!state.fieldErrors?.fullName}
              />
              <FieldError errors={fieldError(state, "fullName")} />
            </Field>
            <Field data-invalid={!!state.fieldErrors?.email}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={!!state.fieldErrors?.email}
              />
              <FieldError errors={fieldError(state, "email")} />
            </Field>
            <Field data-invalid={!!state.fieldErrors?.password}>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                aria-invalid={!!state.fieldErrors?.password}
              />
              <FieldDescription>Mínimo de 8 caracteres.</FieldDescription>
              <FieldError errors={fieldError(state, "password")} />
            </Field>
            <Field>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Criar conta
              </Button>
              <FieldDescription>
                Já tem conta? <Link href="/entrar">Entrar</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
