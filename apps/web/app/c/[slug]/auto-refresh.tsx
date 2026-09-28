"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** Re-fetches the page's server data periodically while the event is live. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000)
    return () => clearInterval(timer)
  }, [router, seconds])

  return null
}
