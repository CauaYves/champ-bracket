import type { Metadata } from "next"
import { Geist_Mono, Kanit, Oswald } from "next/font/google"

import "@workspace/ui/globals.css"
import { FlashToast } from "@/components/flash-toast"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"

// Titles (CardTitle, EmptyTitle, AlertDialogTitle: semibold, uppercase).
// Condensed fight-poster look; variable font, so the 600 weight is real.
const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
})

// Body text. Kanit (Cadson Demak) has the straight, sturdy look of Muay Thai
// and fight-event posters and stays readable at form/table sizes.
// Not a variable font: load every weight the shadcn components use.
const kanit = Kanit({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Fight Bracket",
  description: "Chaves de campeonatos de artes marciais",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        kanit.variable,
        oswald.variable
      )}
    >
      <body>
        <ThemeProvider>
          <Toaster>
            <FlashToast />
            {children}
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
