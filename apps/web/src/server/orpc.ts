import { ORPCError, implement } from '@orpc/server'
import { contract } from '@template/contracts'
import { appMeta, getDb } from '@template/db'
import { isValidWorkerToken } from '@template/domain'
import { auth } from './auth'

export interface RpcContext {
  request: Request
}

const os = implement(contract).$context<RpcContext>()

/**
 * Both clients hit the same procedures: the web app with its Better Auth
 * session cookie, the CLI with "Authorization: Bearer $WORKER_TOKEN".
 */
interface Principal {
  kind: 'user' | 'worker'
}

const requireAuth = os.middleware(async ({ context, next }) => {
  const principal = await resolvePrincipal(context.request)
  if (!principal) throw new ORPCError('UNAUTHORIZED')
  return next({ context: { principal } })
})

async function resolvePrincipal(request: Request): Promise<Principal | null> {
  const header = request.headers.get('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (isValidWorkerToken(bearer, process.env.WORKER_TOKEN)) {
    return { kind: 'worker' }
  }

  const session = await auth.api.getSession({ headers: request.headers })
  return session ? { kind: 'user' } : null
}

export const router = os.router({
  health: {
    check: os.health.check.use(requireAuth).handler(async ({ context }) => {
      const time = new Date().toISOString()
      let database: 'ok' | 'error' = 'ok'
      try {
        await getDb()
          .insert(appMeta)
          .values({ key: 'last_health_check', value: time })
          .onConflictDoUpdate({ target: appMeta.key, set: { value: time } })
      } catch {
        database = 'error'
      }
      return {
        status: 'ok' as const,
        database,
        time,
        authenticatedAs: context.principal.kind,
      }
    }),
  },
})
