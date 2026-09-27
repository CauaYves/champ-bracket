import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@workspace/ui/components/item"

// Draft notice — have it reviewed before production (LGPD, Lei 13.709/2018).
const sections = [
  {
    title: "Quais dados coletamos",
    description:
      "Nome, data de nascimento, sexo, peso, faixa, academia, professor, telefone e e-mail do atleta e, para menores de idade, nome e telefone do responsável.",
  },
  {
    title: "Para que usamos",
    description:
      "Exclusivamente para organizar o campeonato: validar a inscrição, montar as categorias e chaves e entrar em contato sobre o evento.",
  },
  {
    title: "Quem vê",
    description:
      "Nome e academia aparecem nas chaves públicas do campeonato. Os demais dados são acessados apenas pelo organizador do campeonato.",
  },
  {
    title: "Menores de idade",
    description: "A inscrição exige a autorização do responsável legal.",
  },
  {
    title: "Seus direitos",
    description:
      "Você pode solicitar ao organizador do campeonato o acesso, a correção ou a exclusão dos seus dados.",
  },
]

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Aviso de privacidade</CardTitle>
          <CardDescription>
            Como tratamos os dados das inscrições em campeonatos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup>
            {sections.map((section) => (
              <Item key={section.title} variant="outline">
                <ItemContent>
                  <ItemTitle>{section.title}</ItemTitle>
                  <ItemDescription>{section.description}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    </main>
  )
}
