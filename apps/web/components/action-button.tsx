"use client"

import { useState, useTransition } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"

type Result = { error?: string; message?: string }

export function notify(result: Result) {
  // An action that ends in redirect() resolves without a value; the next
  // page shows its message instead (see setFlash).
  if (!result) return
  if (result.error) toast.add({ title: result.error, type: "error" })
  else if (result.message) toast.add({ title: result.message, type: "success" })
}

/**
 * Runs a Server Action and toasts its `{ error | message }` result.
 * With `confirm`, asks first in an AlertDialog.
 */
export function ActionButton({
  action,
  confirm,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "action"> & {
  action: () => Promise<Result>
  confirm?: { title: string; description: string; action: string }
}) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function run() {
    setOpen(false)
    startTransition(async () => notify(await action()))
  }

  const button = (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={confirm ? () => setOpen(true) : run}
    >
      {pending && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  )
  if (!confirm) return button

  return (
    <>
      {button}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={run}>
              {confirm.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
