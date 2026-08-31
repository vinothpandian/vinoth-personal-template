import { describe, expect, test } from 'bun:test'
import {
  hasIdentityRestriction,
  isAllowedEmail,
  isAllowedSubject,
  isValidWorkerToken,
} from './index'

describe('hasIdentityRestriction', () => {
  test('true when email or subject is configured', () => {
    expect(hasIdentityRestriction({ email: 'me@example.com' })).toBe(true)
    expect(hasIdentityRestriction({ subject: 'abc-123' })).toBe(true)
  })

  test('false when nothing (or only blanks) configured', () => {
    expect(hasIdentityRestriction({})).toBe(false)
    expect(hasIdentityRestriction({ email: '  ', subject: '' })).toBe(false)
  })
})

describe('isAllowedEmail', () => {
  test('matches configured email case-insensitively', () => {
    expect(isAllowedEmail('Me@Example.com', 'me@example.com')).toBe(true)
  })

  test('rejects mismatch or missing email when configured', () => {
    expect(isAllowedEmail('other@example.com', 'me@example.com')).toBe(false)
    expect(isAllowedEmail(null, 'me@example.com')).toBe(false)
    expect(isAllowedEmail('', 'me@example.com')).toBe(false)
  })

  test('passes when no email constraint configured', () => {
    expect(isAllowedEmail('anyone@example.com', '')).toBe(true)
    expect(isAllowedEmail('anyone@example.com', null)).toBe(true)
  })
})

describe('isAllowedSubject', () => {
  test('matches configured subject exactly', () => {
    expect(isAllowedSubject('abc-123', 'abc-123')).toBe(true)
    expect(isAllowedSubject('ABC-123', 'abc-123')).toBe(false)
  })

  test('rejects missing subject when configured', () => {
    expect(isAllowedSubject(null, 'abc-123')).toBe(false)
  })

  test('passes when no subject constraint configured', () => {
    expect(isAllowedSubject('anything', '')).toBe(true)
    expect(isAllowedSubject(null, undefined)).toBe(true)
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
