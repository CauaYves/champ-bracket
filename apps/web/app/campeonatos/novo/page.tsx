import { createClient } from "@/lib/supabase/server"

import { ChampionshipForm } from "./championship-form"

export default async function NewChampionshipPage() {
  const supabase = await createClient()
  const { data: presets } = await supabase
    .from("presets")
    .select("id, name")
    .order("owner_id", { nullsFirst: true })
    .order("name")

  return <ChampionshipForm presets={presets ?? []} />
}
