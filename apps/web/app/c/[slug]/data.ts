import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

/** Public championship info (no personal data), deduplicated per request. */
export const getPublicChampionship = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_public_championship", { slug })
  const championship = data?.[0]
  if (!championship) return null
  return {
    ...championship,
    belts: Array.isArray(championship.belts)
      ? championship.belts.map(String)
      : [],
  }
})
