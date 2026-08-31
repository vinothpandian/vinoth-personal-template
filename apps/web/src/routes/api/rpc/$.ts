import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'
import { router } from '../../../server/orpc'

const handler = new RPCHandler(router)

async function handle({ request }: { request: Request }) {
  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: { request },
  })
  return response ?? new Response('Not found', { status: 404 })
}

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
})
