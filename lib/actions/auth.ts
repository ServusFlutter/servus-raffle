'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SignInSchema, SignUpSchema } from '@/lib/schemas/auth'
import { type ActionResult, success, failure } from '@/types/actions'

export async function signIn(
  formData: FormData
): Promise<ActionResult<{ userId: string }>> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  const parsed = SignInSchema.safeParse({ email, password })
  if (!parsed.success) {
    return failure(parsed.error.issues[0].message)
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/', 'layout')
  return success({ userId: data.user.id })
}

export async function signUp(
  formData: FormData
): Promise<ActionResult<{ userId: string }>> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string | null

  // Validate input
  const parsed = SignUpSchema.safeParse({ email, password, name: name ?? undefined })
  if (!parsed.success) {
    return failure(parsed.error.issues[0].message)
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  })

  if (error) {
    return failure(error.message)
  }

  if (!data.user) {
    return failure('Failed to create account')
  }

  revalidatePath('/', 'layout')
  return success({ userId: data.user.id })
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
