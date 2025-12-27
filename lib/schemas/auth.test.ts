import { describe, expect, it } from 'vitest'
import { SignInSchema, SignUpSchema } from './auth'

describe('SignInSchema', () => {
  it('should validate valid email and password', () => {
    const input = { email: 'test@example.com', password: 'password123' }
    const result = SignInSchema.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@example.com')
      expect(result.data.password).toBe('password123')
    }
  })

  it('should reject invalid email', () => {
    const input = { email: 'not-an-email', password: 'password123' }
    const result = SignInSchema.safeParse(input)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('should reject empty email', () => {
    const input = { email: '', password: 'password123' }
    const result = SignInSchema.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const input = { email: 'test@example.com', password: '' }
    const result = SignInSchema.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('should reject password shorter than 6 characters', () => {
    const input = { email: 'test@example.com', password: '12345' }
    const result = SignInSchema.safeParse(input)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })
})

describe('SignUpSchema', () => {
  it('should validate valid signup data', () => {
    const input = {
      email: 'new@example.com',
      password: 'password123',
      name: 'Test User',
    }
    const result = SignUpSchema.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('new@example.com')
      expect(result.data.password).toBe('password123')
      expect(result.data.name).toBe('Test User')
    }
  })

  it('should allow optional name', () => {
    const input = {
      email: 'new@example.com',
      password: 'password123',
    }
    const result = SignUpSchema.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBeUndefined()
    }
  })

  it('should reject invalid email', () => {
    const input = {
      email: 'invalid',
      password: 'password123',
      name: 'Test',
    }
    const result = SignUpSchema.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const input = {
      email: 'new@example.com',
      password: '12345',
      name: 'Test',
    }
    const result = SignUpSchema.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('should trim and normalize name', () => {
    const input = {
      email: 'new@example.com',
      password: 'password123',
      name: '  Test User  ',
    }
    const result = SignUpSchema.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Test User')
    }
  })
})
