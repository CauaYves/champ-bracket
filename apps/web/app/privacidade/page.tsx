import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

// Draft notice — have it reviewed before production (LGPD, Lei 13.709/2018).
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
        <CardContent className="flex flex-col gap-4">
          <p>
            <strong>Quais dados coletamos:</strong> nome, data de nascimento,
            sexo, peso, faixa, academia, professor, telefone e e-mail do atleta
            e, para menores de idade, nome e telefone do responsável.
          </p>
          <p>
            <strong>Para que usamos:</strong> exclusivamente para organizar o
            campeonato: validar a inscrição, montar as categorias e chaves e
            entrar em contato sobre o evento.
          </p>
          <p>
            <strong>Quem vê:</strong> nome e academia aparecem nas chaves
            públicas do campeonato. Os demais dados são acessados apenas pelo
            organizador do campeonato.
          </p>
          <p>
            <strong>Menores de idade:</strong> a inscrição exige a autorização
            do responsável legal.
          </p>
          <p>
            <strong>Seus direitos:</strong> você pode solicitar ao organizador
            do campeonato o acesso, a correção ou a exclusão dos seus dados.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
