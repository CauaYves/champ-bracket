/** Return value of Server Actions used with `useActionState`. */
export type FormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: boolean
}

export function fieldError(state: FormState, field: string) {
  return state.fieldErrors?.[field]?.map((message) => ({ message }))
}

/** User-facing message; in development, appends the underlying error for debugging. */
export function errorMessage(message: string, error: { message: string }) {
  return process.env.NODE_ENV === "development"
    ? `${message} (${error.message})`
    : message
}
