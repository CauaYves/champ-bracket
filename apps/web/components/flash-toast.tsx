"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { toast } from "@workspace/ui/components/toast"

// Same name as FLASH_COOKIE in lib/flash.ts (server-only module).
const FLASH_COOKIE = "flash"

/** Shows (once) the message queued by `setFlash()` before a redirect. */
export function FlashToast() {
  const pathname = usePathname()

  useEffect(() => {
    const entry = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${FLASH_COOKIE}=`))
    if (!entry) return

    document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0`
    const message = decodeURIComponent(entry.slice(FLASH_COOKIE.length + 1))
    if (message) toast.add({ title: message, type: "success" })
  }, [pathname])

  return null
}
