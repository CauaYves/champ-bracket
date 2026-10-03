"use client"

import { MaximizeIcon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"

// shadcn has no QR code component; qrcode.react renders a plain SVG.
export function DisplayQrCode({ value }: { value: string }) {
  return (
    <QRCodeSVG
      value={value}
      size={1024}
      marginSize={2}
      title="QR Code de inscrição"
      className="h-auto w-full"
    />
  )
}

/**
 * Keeps the display (TV, tablet) from dimming or sleeping while the page is
 * visible. Silently does nothing where the Wake Lock API is unavailable.
 */
export function KeepScreenOn() {
  useEffect(() => {
    let active = true
    let lock: WakeLockSentinel | null = null

    async function acquire() {
      if (!active || document.visibilityState !== "visible") return
      try {
        const next = await navigator.wakeLock?.request("screen")
        // Unmounted while the request was pending: don't keep the lock.
        if (!active) {
          await next?.release()
          return
        }
        // Overlapping visibilitychange events: keep only the newest lock.
        if (lock && lock !== next) await lock.release()
        lock = next ?? null
      } catch {
        // Denied (battery saver, unsupported browser): nothing to do.
      }
    }

    // The lock is released when the tab is hidden; take it again on return.
    document.addEventListener("visibilitychange", acquire)
    acquire()
    return () => {
      active = false
      document.removeEventListener("visibilitychange", acquire)
      lock?.release()
      lock = null
    }
  }, [])

  return null
}

export function FullscreenButton() {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement !== null)
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  if (fullscreen) return null
  return (
    <Button
      variant="outline"
      onClick={() => document.documentElement.requestFullscreen?.()}
    >
      <MaximizeIcon data-icon="inline-start" />
      Tela cheia
    </Button>
  )
}
