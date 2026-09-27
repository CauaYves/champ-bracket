import { PageBreadcrumb } from "@/components/page-breadcrumb"

import { PresetForm } from "../preset-form"

export default function NewPresetPage() {
  return (
    <>
      <PageBreadcrumb
        items={[{ label: "Modalidades", href: "/modalidades" }]}
        page="Nova modalidade"
      />
      <PresetForm
        presetId={null}
        name=""
        criteria={{
          adultAge: 18,
          belts: [],
          ageCategories: [
            { name: "Infantil", minAge: 0, maxAge: 17 },
            { name: "Adulto", minAge: 18, maxAge: null },
          ],
        }}
      />
    </>
  )
}
