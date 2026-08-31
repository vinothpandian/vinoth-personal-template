import { timingSafeEqual } from 'node:crypto'

export interface AllowedIdentity {
  email?: string | null
  subject?: string | null
}

/**
 * True when at least one identity constraint (email or subject) is
 * configured. With no constraints configured nobody may sign in
 * (fail closed) — the auth layer must reject sign-in when this is false.
 */
export function hasIdentityRestriction(allowed: AllowedIdentity): boolean {
  return !!allowed.email?.trim() || !!allowed.subject?.trim()
}

/**
 * Email gate: passes when no email constraint is configured, or when the
 * email matches it case-insensitively. A configured constraint with a
 * missing email fails.
 */
export function isAllowedEmail(
  email: string | null | undefined,
  allowedEmail: string | null | undefined,
): boolean {
  const allowed = allowedEmail?.trim()
  if (!allowed) return true
  return !!email && email.toLowerCase() === allowed.toLowerCase()
}

/**
 * OIDC subject gate: passes when no subject constraint is configured, or
 * when the subject matches it exactly. A configured constraint with a
 * missing subject fails.
 */
export function isAllowedSubject(
  subject: string | null | undefined,
  allowedSubject: string | null | undefined,
): boolean {
  const allowed = allowedSubject?.trim()
  if (!allowed) return true
  return !!subject && subject === allowed
}

/**
 * Dev-only auth bypass for cloud agents that need to implement and test
 * against the app without a Pocket ID session. True only when
 * AUTH_DEV_BYPASS is exactly "1" AND NODE_ENV is not "production" — the
 * double gate keeps a stray env var in a deployed environment from
 * silently disabling the single-user restriction.
 */
export function isAuthBypass(env: {
  AUTH_DEV_BYPASS?: string | null
  NODE_ENV?: string | null
}): boolean {
  return env.AUTH_DEV_BYPASS === '1' && env.NODE_ENV !== 'production'
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
