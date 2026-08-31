import { oc } from '@orpc/contract'
import { HealthStatus } from './schemas'

export const contract = {
  health: {
    check: oc.output(HealthStatus),
  },
}

export type Contract = typeof contract

export { HealthStatus, PrincipalKind } from './schemas'
