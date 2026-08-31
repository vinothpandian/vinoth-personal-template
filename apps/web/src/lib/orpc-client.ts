import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import type { contract } from '@template/contracts'

// Browser-only client (call from event handlers/effects, not during SSR).
const link = new RPCLink({
  url: () =>
    typeof window === 'undefined'
      ? 'http://127.0.0.1:3000/api/rpc'
      : `${window.location.origin}/api/rpc`,
})

export const api: ContractRouterClient<typeof contract> = createORPCClient(link)
