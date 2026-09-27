import { CopyIcon, PencilIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/item"

import { criteriaSchema } from "@/lib/criteria"
import { createClient, getUserId } from "@/lib/supabase/server"

import { duplicatePreset } from "./actions"
import { DeletePresetButton } from "./delete-preset-button"

export default async function PresetsPage() {
  const userId = await getUserId()
  const supabase = await createClient()
  const { data: presets } = await supabase
    .from("presets")
    .select("id, name, owner_id, criteria")
    .order("owner_id", { nullsFirst: true })
    .order("name")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modalidades</CardTitle>
        <CardDescription>
          Faixas e categorias de idade usadas nos campeonatos. Duplique uma
          modalidade padrão para personalizá-la.
        </CardDescription>
        <CardAction>
          <Button
            render={<Link href="/modalidades/nova" />}
            nativeButton={false}
          >
            <PlusIcon data-icon="inline-start" />
            Nova modalidade
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {(presets ?? []).map((preset) => {
            const criteria = criteriaSchema.safeParse(preset.criteria)
            const own = preset.owner_id === userId
            return (
              <Item key={preset.id} variant="outline">
                <ItemContent>
                  <ItemTitle>
                    {preset.name}
                    {!own && <Badge variant="secondary">Padrão</Badge>}
                  </ItemTitle>
                  {criteria.success && (
                    <ItemDescription>
                      {criteria.data.belts.length} faixas ·{" "}
                      {criteria.data.ageCategories
                        .map((category) => category.name)
                        .join(", ")}
                    </ItemDescription>
                  )}
                </ItemContent>
                <ItemActions>
                  <form action={duplicatePreset.bind(null, preset.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Duplicar"
                    >
                      <CopyIcon />
                    </Button>
                  </form>
                  {own && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar"
                        render={<Link href={`/modalidades/${preset.id}`} />}
                        nativeButton={false}
                      >
                        <PencilIcon />
                      </Button>
                      <DeletePresetButton
                        presetId={preset.id}
                        name={preset.name}
                      />
                    </>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
