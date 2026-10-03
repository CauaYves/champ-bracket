import { QrCodeIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@workspace/ui/components/item"

import { formatDate } from "@/lib/labels"
import { getOrigin, registrationUrl } from "@/lib/url"

import { AutoRefresh } from "../auto-refresh"
import { getPublicChampionship } from "../data"
import {
  DisplayQrCode,
  FullscreenButton,
  KeepScreenOn,
} from "./display-controls"

export async function generateMetadata({
  params,
}: PageProps<"/c/[slug]/qrcode">): Promise<Metadata> {
  const { slug } = await params
  const championship = await getPublicChampionship(slug)
  return {
    title: championship ? `Inscrições · ${championship.name}` : "QR Code",
  }
}

/**
 * Full-screen QR code to leave on a second screen (TV, tablet) during the
 * event. Public on purpose: the display device needs no organizer login.
 */
export default async function RegistrationQrPage({
  params,
}: PageProps<"/c/[slug]/qrcode">) {
  const { slug } = await params
  const championship = await getPublicChampionship(slug)
  if (!championship) notFound()

  const url = registrationUrl(await getOrigin(), slug)
  const open = championship.status === "registration_open"

  return (
    <div className="flex flex-1 items-center justify-center">
      {/* Picks up the organizer opening/closing registration. */}
      <AutoRefresh seconds={15} />
      <KeepScreenOn />

      {open ? (
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>{championship.name}</CardTitle>
            <CardDescription>
              {formatDate(championship.event_date)} · {championship.location}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <Item variant="muted">
              <ItemContent>
                <ItemTitle>
                  Aponte a câmera do celular para o QR Code e faça sua inscrição
                </ItemTitle>
                <ItemDescription>
                  A inscrição é confirmada após a aprovação do organizador.
                </ItemDescription>
              </ItemContent>
            </Item>
            <div className="w-[min(60vh,100%)]">
              <DisplayQrCode value={url} />
            </div>
            <Item variant="outline">
              <ItemContent>
                <ItemDescription>Sem câmera? Acesse:</ItemDescription>
                <ItemTitle>{url}</ItemTitle>
              </ItemContent>
            </Item>
          </CardContent>
          <CardFooter>
            <FullscreenButton />
          </CardFooter>
        </Card>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <QrCodeIcon />
            </EmptyMedia>
            <EmptyTitle>{championship.name}</EmptyTitle>
            <EmptyDescription>
              As inscrições estão encerradas. Se forem reabertas, o QR Code
              volta a aparecer aqui automaticamente.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
