import { describe, it, expect } from 'vitest'
import { nanoid } from 'nanoid'

describe('invite token', () => {
  it('generates a 10-character token', () => {
    const token = nanoid(10)
    expect(token).toHaveLength(10)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => nanoid(10)))
    expect(tokens.size).toBe(100)
  })
})
