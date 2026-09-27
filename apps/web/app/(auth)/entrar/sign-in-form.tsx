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
import { Spinner } from "@workspace/ui/components/spinner"

import { fieldError, type FormState } from "@/lib/form-state"

import { signIn } from "../actions"

export function SignInForm({
  next,
  notice,
}: {
  next?: string
  notice?: string
}) {
  const [state, action, pending] = useActionState(signIn, {} as FormState)
  const message = state.error ?? notice

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse seus campeonatos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <input type="hidden" name="next" value={next ?? ""} />
          <FieldGroup>
            {message && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
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
                autoComplete="current-password"
                required
                aria-invalid={!!state.fieldErrors?.password}
              />
              <FieldError errors={fieldError(state, "password")} />
            </Field>
            <Field>
              <Button type="submit" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Entrar
              </Button>
              <FieldDescription>
                Não tem conta? <Link href="/cadastro">Cadastre-se</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
