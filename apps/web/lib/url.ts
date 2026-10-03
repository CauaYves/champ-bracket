import { headers } from "next/headers"

/** Absolute origin of the current request (for QR codes and share links). */
export async function getOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "http"
  return `${proto}://${host}`
}

export function publicChampionshipUrl(origin: string, slug: string) {
  return `${origin}/c/${slug}`
}

export function registrationUrl(origin: string, slug: string) {
  return `${publicChampionshipUrl(origin, slug)}/inscricao`
}

/** Full-screen QR page for a second screen (relative: opened from the app). */
export function qrDisplayPath(slug: string) {
  return `/c/${slug}/qrcode`
}
