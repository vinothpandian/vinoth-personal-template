import { z } from 'zod'

export const PrincipalKind = z.enum(['user', 'worker'])
export type PrincipalKind = z.infer<typeof PrincipalKind>

export const HealthStatus = z.object({
  status: z.literal('ok'),
  database: z.enum(['ok', 'error']),
  time: z.iso.datetime(),
  authenticatedAs: PrincipalKind,
})
export type HealthStatus = z.infer<typeof HealthStatus>
