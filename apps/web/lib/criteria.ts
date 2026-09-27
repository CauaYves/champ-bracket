import { z } from "zod"

export const criteriaSchema = z.object({
  adultAge: z.number().int().positive().default(18),
  belts: z.array(z.string()).min(1),
  ageCategories: z.array(
    z.object({
      name: z.string(),
      minAge: z.number().int(),
      maxAge: z.number().int().nullable(),
    })
  ),
})

/** Division criteria snapshot stored on presets and championships. */
export type Criteria = z.infer<typeof criteriaSchema>
