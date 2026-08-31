import { timingSafeEqual } from 'node:crypto'

/**
 * Single-user gate: an identity is allowed if it matches the configured
 * email or OIDC subject. Empty/unset config values never match anything,
 * so with no configuration nobody can sign in (fail closed).
 */
export function isAllowedIdentity(
  identity: { email?: string | null; subject?: string | null },
  allowed: { email?: string | null; subject?: string | null },
): boolean {
  const emailAllowed =
    !!allowed.email &&
    !!identity.email &&
    identity.email.toLowerCase() === allowed.email.toLowerCase()
  const subjectAllowed =
    !!allowed.subject && !!identity.subject && identity.subject === allowed.subject
  return emailAllowed || subjectAllowed
}

/**
 * Constant-time comparison for static bearer tokens. Rejects empty
 * expected tokens so an unset WORKER_TOKEN can never authenticate.
 */
export function isValidWorkerToken(
  presented: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!presented || !expected) return false
  const a = Buffer.from(presented)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
