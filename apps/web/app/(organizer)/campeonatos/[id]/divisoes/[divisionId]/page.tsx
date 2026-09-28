import { competitionAge } from "@workspace/bracket-engine"
import { UserIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { ActionButton } from "@/components/action-button"
import { BracketView } from "@/components/bracket-view"
import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { Podium } from "@/components/podium"
import { parseBracket, type AthleteMap } from "@/lib/bracket"
import { formatPhone, formatWeight } from "@/lib/format"
import { divisionStatusLabel, genderLabel } from "@/lib/labels"
import { createClient } from "@/lib/supabase/server"

import {
  deleteDivision,
  discardBracket,
  drawBracket,
  moveAthlete,
  recordMatchWinner,
  setThirdPlaceMatch,
  startDivision,
  swapBracketSlots,
  undoMatchResult,
} from "../actions"
import { MoveAthlete, ThirdPlaceSwitch } from "./division-controls"

export default async function DivisionPage({
  params,
}: PageProps<"/campeonatos/[id]/divisoes/[divisionId]">) {
  const { id, divisionId } = await params
  const supabase = await createClient()

  const [
    { data: championship },
    { data: division },
    { data: athletes },
    { data: otherDivisions },
  ] = await Promise.all([
    supabase
      .from("championships")
      .select("id, name, event_date")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("divisions")
      .select("*")
      .eq("id", divisionId)
      .eq("championship_id", id)
      .maybeSingle(),
    supabase
      .from("registrations")
      .select(
        "id, full_name, academy, coach, birth_date, gender, weight_kg, belt, phone, guardian_name, guardian_phone"
      )
      .eq("division_id", divisionId)
      .eq("status", "approved")
      .order("full_name"),
    supabase
      .from("divisions")
      .select("id, name")
      .eq("championship_id", id)
      .neq("id", divisionId)
      .is("bracket", null)
      .order("name"),
  ])
  if (!championship || !division) notFound()

  const bracket = parseBracket(division.bracket)
  const athleteCount = athletes?.length ?? 0
  const eventYear = Number(championship.event_date.slice(0, 4))
  const athleteMap: AthleteMap = Object.fromEntries(
    (athletes ?? []).map((a) => [
      a.id,
      {
        name: a.full_name,
        academy: a.academy,
        details: [
          {
            label: "Idade",
            value: `${competitionAge(a.birth_date, eventYear)} anos`,
          },
          { label: "Sexo", value: genderLabel[a.gender] },
          { label: "Peso", value: formatWeight(a.weight_kg) },
          { label: "Faixa", value: a.belt },
          ...(a.coach ? [{ label: "Professor", value: a.coach }] : []),
          { label: "Telefone", value: formatPhone(a.phone) },
          ...(a.guardian_name
            ? [
                {
                  label: "Responsável",
                  value: [
                    a.guardian_name,
                    a.guardian_phone && formatPhone(a.guardian_phone),
                  ]
                    .filter(Boolean)
                    .join(" · "),
                },
              ]
            : []),
        ],
      },
    ])
  )
  const isDraft = division.status === "draft"

  return (
    <>
      <PageBreadcrumb
        items={[
          { label: "Campeonatos", href: "/campeonatos" },
          { label: championship.name, href: `/campeonatos/${championship.id}` },
        ]}
        page={division.name}
      />

      <Card>
        <CardHeader>
          <CardTitle>{division.name}</CardTitle>
          <CardDescription>
            {athleteCount} atleta(s) · Eliminatória simples (mata-mata)
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {divisionStatusLabel[division.status]}
            </Badge>
          </CardAction>
        </CardHeader>
        {isDraft && (
          <CardContent>
            <ThirdPlaceSwitch
              checked={division.third_place_match}
              disabled={!isDraft}
              onChange={setThirdPlaceMatch.bind(null, division.id)}
            />
          </CardContent>
        )}
        {isDraft && (
          <CardFooter className="flex flex-wrap gap-2">
            {!bracket && athleteCount >= 2 && (
              <ActionButton action={drawBracket.bind(null, division.id)}>
                Sortear chave
              </ActionButton>
            )}
            {!bracket && (
              <ActionButton
                variant="outline"
                action={deleteDivision.bind(null, division.id)}
                confirm={{
                  title: "Excluir esta divisão?",
                  description:
                    "Os atletas voltam para “sem divisão” e podem ser distribuídos de novo.",
                  action: "Excluir",
                }}
              >
                Excluir divisão
              </ActionButton>
            )}
            {bracket && (
              <>
                <ActionButton
                  action={startDivision.bind(null, division.id)}
                  confirm={{
                    title: "Iniciar as lutas?",
                    description:
                      "Depois de iniciar, os confrontos não podem mais ser reorganizados. Os resultados poderão ser corrigidos.",
                    action: "Iniciar",
                  }}
                >
                  Iniciar lutas
                </ActionButton>
                <ActionButton
                  variant="outline"
                  action={drawBracket.bind(null, division.id)}
                  confirm={{
                    title: "Sortear novamente?",
                    description:
                      "Um novo sorteio substitui os confrontos atuais, incluindo as trocas feitas à mão.",
                    action: "Sortear",
                  }}
                >
                  Sortear novamente
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  action={discardBracket.bind(null, division.id)}
                  confirm={{
                    title: "Descartar a chave?",
                    description:
                      "A divisão volta para a montagem e os atletas podem ser movidos.",
                    action: "Descartar",
                  }}
                >
                  Descartar chave
                </ActionButton>
              </>
            )}
          </CardFooter>
        )}
      </Card>

      {bracket ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Chave</CardTitle>
              <CardDescription>
                {isDraft
                  ? "Arraste um atleta sobre outro, ou use “Trocar”, para ajustar os confrontos da primeira rodada. Depois clique em “Iniciar lutas”."
                  : "Clique em “Venceu” para registrar o vencedor de cada luta. Use o botão de desfazer para corrigir um resultado."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDraft ? (
                <BracketView
                  mode="arrange"
                  bracket={bracket}
                  athletes={athleteMap}
                  onSwap={swapBracketSlots.bind(null, division.id)}
                />
              ) : (
                <BracketView
                  mode="score"
                  bracket={bracket}
                  athletes={athleteMap}
                  onRecord={recordMatchWinner.bind(null, division.id)}
                  onUndo={undoMatchResult.bind(null, division.id)}
                />
              )}
            </CardContent>
          </Card>
          {division.status === "finished" && (
            <Card>
              <CardHeader>
                <CardTitle>Pódio</CardTitle>
              </CardHeader>
              <CardContent>
                <Podium bracket={bracket} athletes={athleteMap} />
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {athleteCount < 2 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserIcon />
                </EmptyMedia>
                <EmptyTitle>Aguardando adversário</EmptyTitle>
                <EmptyDescription>
                  {athleteCount === 0
                    ? "Esta divisão ainda não tem atletas."
                    : "Esta divisão tem apenas 1 atleta. Ele aguarda até ser pareado: mova um atleta de outra divisão para cá ou aguarde novas inscrições."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {athleteCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Atletas</CardTitle>
                <CardDescription>
                  Mova atletas entre divisões antes de sortear a chave.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Faixa</TableHead>
                      <TableHead>Academia</TableHead>
                      <TableHead>
                        <span className="sr-only">Mover</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {athletes?.map((athlete) => (
                      <TableRow key={athlete.id}>
                        <TableCell>{athlete.full_name}</TableCell>
                        <TableCell>
                          {competitionAge(athlete.birth_date, eventYear)}
                        </TableCell>
                        <TableCell>{formatWeight(athlete.weight_kg)}</TableCell>
                        <TableCell>{athlete.belt}</TableCell>
                        <TableCell>{athlete.academy}</TableCell>
                        <TableCell>
                          <MoveAthlete
                            athleteName={athlete.full_name}
                            divisions={otherDivisions ?? []}
                            onMove={moveAthlete.bind(
                              null,
                              athlete.id,
                              division.id
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  )
}
