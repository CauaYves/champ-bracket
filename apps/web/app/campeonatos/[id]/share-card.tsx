"use client"

import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function ShareCard({
  registrationUrl,
  publicUrl,
}: {
  registrationUrl: string
  publicUrl: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(registrationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrições</CardTitle>
        <CardDescription>
          Os atletas escaneiam o QR Code e preenchem o formulário de inscrição.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <QRCodeSVG value={registrationUrl} size={192} marginSize={2} />
        <Field>
          <FieldLabel htmlFor="registration-url">Link de inscrição</FieldLabel>
          <Input id="registration-url" value={registrationUrl} readOnly />
        </Field>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copy}>
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        <Button
          variant="ghost"
          render={<a href={publicUrl} target="_blank" rel="noreferrer" />}
          nativeButton={false}
        >
          <ExternalLinkIcon data-icon="inline-start" />
          Página pública
        </Button>
      </CardFooter>
    </Card>
  )
}
