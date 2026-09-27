/** Return value of Server Actions used with `useActionState`. */
export type FormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: boolean
}

export function fieldError(state: FormState, field: string) {
  return state.fieldErrors?.[field]?.map((message) => ({ message }))
}
