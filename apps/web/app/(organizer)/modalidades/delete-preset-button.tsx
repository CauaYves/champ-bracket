"use client"

import { Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"

import { deletePreset } from "./actions"

export function DeletePresetButton({
  presetId,
  name,
}: {
  presetId: string
  name: string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Excluir" />}
      >
        <Trash2Icon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Campeonatos já criados com esta modalidade não são afetados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={deletePreset.bind(null, presetId)}>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction type="submit" variant="destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
