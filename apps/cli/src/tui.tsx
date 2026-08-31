import { createCliRenderer } from '@opentui/core'
import { createRoot, useKeyboard } from '@opentui/react'
import type { HealthStatus } from '@template/contracts'
import { useCallback, useEffect, useState } from 'react'
import { createApiClient } from './client'

const api = createApiClient()

function HealthView() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setHealth(null)
    setError(null)
    try {
      setHealth(await api.health.check())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useKeyboard((key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) process.exit(0)
    if (key.name === 'r') void refresh()
  })

  return (
    <box style={{ padding: 1, flexDirection: 'column' }}>
      <text style={{ fg: '#8be9fd' }}>Personal Template — status</text>
      <text> </text>
      {error ? (
        <text style={{ fg: '#ff5555' }}>error: {error}</text>
      ) : health ? (
        <box style={{ flexDirection: 'column' }}>
          <text>status: {health.status}</text>
          <text
            style={{ fg: health.database === 'ok' ? '#50fa7b' : '#ff5555' }}
          >
            database: {health.database}
          </text>
          <text>authenticated as: {health.authenticatedAs}</text>
          <text>checked at: {health.time}</text>
        </box>
      ) : (
        <text>loading…</text>
      )}
      <text> </text>
      <text style={{ fg: '#6272a4' }}>r refresh · q quit</text>
    </box>
  )
}

export async function runTui(): Promise<void> {
  const renderer = await createCliRenderer()
  createRoot(renderer).render(<HealthView />)
}
