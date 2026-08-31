import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import type { contract } from '@template/contracts'

export function createApiClient(): ContractRouterClient<typeof contract> {
  const apiUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
  const workerToken = process.env.WORKER_TOKEN
  if (!workerToken) {
    console.error('WORKER_TOKEN is not set')
    process.exit(1)
  }

  const link = new RPCLink({
    url: `${apiUrl}/api/rpc`,
    headers: { authorization: `Bearer ${workerToken}` },
  })

  return createORPCClient(link)
}
