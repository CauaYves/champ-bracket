"use client"

import { CopyIcon, ExternalLinkIcon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import { toast } from "@workspace/ui/components/toast"

export function ShareCard({
  registrationUrl,
  publicUrl,
}: {
  registrationUrl: string
  publicUrl: string
}) {
  async function copy() {
    await navigator.clipboard.writeText(registrationUrl)
    toast.add({ title: "Link copiado", type: "success" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrições</CardTitle>
        <CardDescription>
          Os atletas escaneiam o QR Code e preenchem o formulário de inscrição.
        </CardDescription>
      </CardHeader>
      {/* shadcn has no QR code component; qrcode.react renders a plain SVG. */}
      <CardContent className="flex flex-col items-center gap-6">
        <QRCodeSVG value={registrationUrl} size={192} marginSize={2} />
        <Field>
          <FieldLabel htmlFor="registration-url">Link de inscrição</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="registration-url"
              value={registrationUrl}
              readOnly
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={copy}>
                <CopyIcon data-icon="inline-start" />
                Copiar
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
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
