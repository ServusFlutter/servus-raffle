import { z } from 'zod'

export const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type SignInInput = z.infer<typeof SignInSchema>

export const SignUpSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z
    .string()
    .transform((val) => val.trim())
    .optional(),
})

export type SignUpInput = z.infer<typeof SignUpSchema>
