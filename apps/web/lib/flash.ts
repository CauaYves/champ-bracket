import { cookies } from "next/headers"

/** Cookie read (and cleared) by `components/flash-toast.tsx`. */
export const FLASH_COOKIE = "flash"

/**
 * Queues a success toast for the next page, for Server Actions that
 * `redirect()` and so can't return a message to the caller.
 */
export async function setFlash(message: string) {
  const store = await cookies()
  store.set(FLASH_COOKIE, message, {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    // Read by client code to show the toast; holds no sensitive data.
    httpOnly: false,
  })
}
