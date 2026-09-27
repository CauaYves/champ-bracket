import { LayersIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { createClient } from "@/lib/supabase/server"

import { ChampionshipForm } from "./championship-form"

export default async function NewChampionshipPage() {
  const supabase = await createClient()
  const { data: presets } = await supabase
    .from("presets")
    .select("id, name")
    .order("owner_id", { nullsFirst: true })
    .order("name")

  return (
    <>
      <PageBreadcrumb
        items={[{ label: "Campeonatos", href: "/campeonatos" }]}
        page="Novo campeonato"
      />
      {presets?.length ? (
        <ChampionshipForm presets={presets} />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayersIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhuma modalidade disponível</EmptyTitle>
            <EmptyDescription>
              Crie uma modalidade com as faixas e categorias de idade antes de
              criar o campeonato.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              render={<Link href="/modalidades/nova" />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              Nova modalidade
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </>
  )
}
