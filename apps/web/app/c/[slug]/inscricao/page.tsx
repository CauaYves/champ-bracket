import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

import { getPublicChampionship } from "../data"
import { RegistrationForm } from "./registration-form"

export default async function RegistrationPage({
  params,
}: PageProps<"/c/[slug]/inscricao">) {
  const { slug } = await params
  const championship = await getPublicChampionship(slug)
  if (!championship) notFound()

  if (championship.status !== "registration_open") {
    return (
      <Alert>
        <AlertTitle>Inscrições encerradas</AlertTitle>
        <AlertDescription>
          <p>
            As inscrições para {championship.name} não estão abertas no momento.
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
    <RegistrationForm
      slug={slug}
      championshipName={championship.name}
      eventYear={Number(championship.event_date.slice(0, 4))}
      adultAge={championship.adult_age}
      belts={championship.belts}
    />
  )
}
