import { SignInForm } from "./sign-in-form"

export default async function SignInPage({
  searchParams,
}: PageProps<"/entrar">) {
  const { next, erro } = await searchParams
  return (
    <SignInForm
      next={typeof next === "string" ? next : undefined}
      notice={
        erro === "confirmacao"
          ? "Link de confirmação inválido ou expirado."
          : undefined
      }
    />
  )
}
