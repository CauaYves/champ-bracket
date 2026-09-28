import {
  getPlacements,
  type SingleEliminationBracket,
} from "@workspace/bracket-engine"
import { MedalIcon, TrophyIcon } from "lucide-react"

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item"

import type { AthleteMap } from "@/lib/bracket"

/** Medals decided so far; renders nothing until there is a champion. */
export function Podium({
  bracket,
  athletes,
}: {
  bracket: SingleEliminationBracket
  athletes: AthleteMap
}) {
  const placements = getPlacements(bracket)
  if (!placements.gold) return null

  const rows = [
    { medal: "Ouro", id: placements.gold, icon: TrophyIcon },
    ...(placements.silver
      ? [{ medal: "Prata", id: placements.silver, icon: MedalIcon }]
      : []),
    ...placements.bronze.map((id) => ({
      medal: "Bronze",
      id,
      icon: MedalIcon,
    })),
  ]

  return (
    <ItemGroup>
      {rows.map((row) => (
        <Item key={`${row.medal}-${row.id}`} variant="outline">
          <ItemMedia variant="icon">
            <row.icon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {row.medal} · {athletes[row.id]?.name ?? "Atleta"}
            </ItemTitle>
            <ItemDescription>{athletes[row.id]?.academy}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}
