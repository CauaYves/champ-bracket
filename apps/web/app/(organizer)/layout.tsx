import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

import { signOut } from "@/app/(auth)/actions"

import { OrganizerNav } from "./organizer-nav"

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
        <OrganizerNav />
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Sair
          </Button>
        </form>
      </header>
      <Separator />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
        {children}
      </main>
    </div>
  )
}
