import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { isAuthBypass } from '@template/domain'
import { auth } from './auth'

export interface SessionUser {
  name: string
  email: string
}

/**
 * Route guards call this from `beforeLoad`; it runs on the server for
 * both SSR and client navigations.
 */
export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    if (isAuthBypass(process.env)) {
      return { name: 'Dev Bypass', email: 'dev@localhost' }
    }
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) return null
    return { name: session.user.name, email: session.user.email }
  },
)
