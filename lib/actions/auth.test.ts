import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { signIn, signOut, signUp } from './auth'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value)
  }
  return formData
}

describe('signIn', () => {
  const mockSignInWithPassword = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServerSupabaseClient as Mock).mockResolvedValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    })
  })

  it('should return failure for invalid email', async () => {
    const formData = createFormData({
      email: 'invalid-email',
      password: 'password123',
    })

    const result = await signIn(formData)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Invalid email address')
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('should return failure for short password', async () => {
    const formData = createFormData({
      email: 'test@example.com',
      password: '12345',
    })

    const result = await signIn(formData)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Password must be at least 6 characters')
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('should return failure when Supabase auth fails', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    const formData = createFormData({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    const result = await signIn(formData)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Invalid login credentials')
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword',
    })
  })

  it('should return success with userId when auth succeeds', async () => {
    const userId = 'user-123'
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    const formData = createFormData({
      email: 'test@example.com',
      password: 'correctpassword',
    })

    const result = await signIn(formData)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ userId })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })
})

describe('signUp', () => {
  const mockSignUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServerSupabaseClient as Mock).mockResolvedValue({
      auth: {
        signUp: mockSignUp,
      },
    })
  })

  it('should return failure for invalid email', async () => {
    const formData = createFormData({
      email: 'invalid-email',
      password: 'password123',
    })

    const result = await signUp(formData)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Invalid email address')
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should return failure for short password', async () => {
    const formData = createFormData({
      email: 'test@example.com',
      password: '12345',
    })

    const result = await signUp(formData)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Password must be at least 6 characters')
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('should return failure when Supabase signup fails', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' },
    })

    const formData = createFormData({
      email: 'existing@example.com',
      password: 'password123',
    })

    const result = await signUp(formData)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Email already registered')
  })

  it('should return failure when no user is returned', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const formData = createFormData({
      email: 'test@example.com',
      password: 'password123',
    })

    const result = await signUp(formData)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Failed to create account')
  })

  it('should return success with userId when signup succeeds', async () => {
    const userId = 'new-user-123'
    mockSignUp.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    const formData = createFormData({
      email: 'newuser@example.com',
      password: 'password123',
    })

    const result = await signUp(formData)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ userId })
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      options: {
        data: {
          name: undefined,
        },
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('should include name in signup options when provided', async () => {
    const userId = 'new-user-123'
    mockSignUp.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    const formData = createFormData({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'John Doe',
    })

    const result = await signUp(formData)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ userId })
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      options: {
        data: {
          name: 'John Doe',
        },
      },
    })
  })
})

describe('signOut', () => {
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServerSupabaseClient as Mock).mockResolvedValue({
      auth: {
        signOut: mockSignOut,
      },
    })
    mockSignOut.mockResolvedValue({})
  })

  it('should call supabase signOut', async () => {
    await signOut()

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should revalidate the root layout', async () => {
    await signOut()

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('should redirect to login page', async () => {
    await signOut()

    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
