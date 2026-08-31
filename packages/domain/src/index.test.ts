import { describe, expect, test } from 'bun:test'
import { isAllowedIdentity, isValidWorkerToken } from './index'

describe('isAllowedIdentity', () => {
  test('matches allowed email case-insensitively', () => {
    expect(
      isAllowedIdentity({ email: 'Me@Example.com' }, { email: 'me@example.com' }),
    ).toBe(true)
  })

  test('matches allowed subject exactly', () => {
    expect(isAllowedIdentity({ subject: 'abc-123' }, { subject: 'abc-123' })).toBe(true)
    expect(isAllowedIdentity({ subject: 'ABC-123' }, { subject: 'abc-123' })).toBe(false)
  })

  test('either email or subject match is enough', () => {
    expect(
      isAllowedIdentity(
        { email: 'me@example.com', subject: 'wrong' },
        { email: 'me@example.com', subject: 'abc-123' },
      ),
    ).toBe(true)
  })

  test('rejects non-matching identity', () => {
    expect(
      isAllowedIdentity({ email: 'other@example.com' }, { email: 'me@example.com' }),
    ).toBe(false)
  })

  test('fails closed when nothing is configured', () => {
    expect(isAllowedIdentity({ email: 'me@example.com', subject: 'abc' }, {})).toBe(false)
    expect(isAllowedIdentity({ email: '', subject: '' }, { email: '', subject: '' })).toBe(
      false,
    )
  })
})

describe('isValidWorkerToken', () => {
  test('accepts exact match', () => {
    expect(isValidWorkerToken('secret-token', 'secret-token')).toBe(true)
  })

  test('rejects mismatch and prefixes', () => {
    expect(isValidWorkerToken('secret-token', 'other-token00')).toBe(false)
    expect(isValidWorkerToken('secret', 'secret-token')).toBe(false)
  })

  test('rejects empty or missing values', () => {
    expect(isValidWorkerToken('', 'secret')).toBe(false)
    expect(isValidWorkerToken('secret', '')).toBe(false)
    expect(isValidWorkerToken(null, undefined)).toBe(false)
    expect(isValidWorkerToken('', '')).toBe(false)
  })
})
