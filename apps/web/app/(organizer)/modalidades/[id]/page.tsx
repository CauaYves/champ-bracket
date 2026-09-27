import { notFound } from "next/navigation"

import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { criteriaSchema } from "@/lib/criteria"
import { createClient, getUserId } from "@/lib/supabase/server"

import { PresetForm } from "../preset-form"

export default async function EditPresetPage({
  params,
}: PageProps<"/modalidades/[id]">) {
  const { id } = await params
  const userId = await getUserId()
  const supabase = await createClient()
  const { data: preset } = await supabase
    .from("presets")
    .select("id, name, owner_id, criteria")
    .eq("id", id)
    .maybeSingle()

  // Built-in presets are read-only; organizers duplicate them instead.
  if (!preset || preset.owner_id !== userId) notFound()
  const criteria = criteriaSchema.safeParse(preset.criteria)
  if (!criteria.success) notFound()

  return (
    <>
      <PageBreadcrumb
        items={[{ label: "Modalidades", href: "/modalidades" }]}
        page={preset.name}
      />
      <PresetForm
        presetId={preset.id}
        name={preset.name}
        criteria={criteria.data}
      />
    </>
  )
}
