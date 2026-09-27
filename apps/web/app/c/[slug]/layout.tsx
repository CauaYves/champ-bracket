export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-4">
      {children}
    </main>
  )
}
