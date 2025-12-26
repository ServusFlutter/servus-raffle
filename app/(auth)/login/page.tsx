import { LoginForm } from '@/components/auth/login-form'

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm redirectTo={redirect} />
    </main>
  )
}
