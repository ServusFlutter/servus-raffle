import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder (required for Next.js server-side code)
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
