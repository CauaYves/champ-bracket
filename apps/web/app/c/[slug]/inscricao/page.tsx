import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

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
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Inscrições encerradas</EmptyTitle>
          <EmptyDescription>
            As inscrições para {championship.name} não estão abertas no momento.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            render={<Link href={`/c/${slug}`} />}
            nativeButton={false}
          >
            Ver campeonato
          </Button>
        </EmptyContent>
      </Empty>
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
