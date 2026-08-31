import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import type { HealthStatus } from '@template/contracts'
import { useCallback, useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { api } from '../lib/orpc-client'
import { getSessionUser } from '../server/functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (!user) throw redirect({ to: '/login' })
    return { user }
  },
  component: HomePage,
})

function HomePage() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setHealth(null)
    setHealthError(null)
    try {
      setHealth(await api.health.check())
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Request failed')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function signOut() {
    await authClient.signOut()
    await navigate({ to: '/login' })
  }

  return (
    <Container maxW="2xl" py="12">
      <Stack gap="6">
        <Flex justify="space-between" align="center">
          <Heading size="lg">Home</Heading>
          <Button variant="outline" onClick={signOut}>
            Log out
          </Button>
        </Flex>

        <Card.Root>
          <Card.Body>
            <Stack gap="2">
              <Text fontWeight="medium">Signed in as</Text>
              <Text color="fg.muted">
                {user.name} ({user.email})
              </Text>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Body>
            <Stack gap="4">
              <Flex justify="space-between" align="center">
                <Text fontWeight="medium">Backend health</Text>
                <Button size="sm" variant="ghost" onClick={refresh}>
                  Refresh
                </Button>
              </Flex>
              {healthError ? (
                <Text color="fg.error">{healthError}</Text>
              ) : health ? (
                <Stack gap="2">
                  <Flex gap="2" align="center">
                    <Badge colorPalette="green">status: {health.status}</Badge>
                    <Badge
                      colorPalette={health.database === 'ok' ? 'green' : 'red'}
                    >
                      database: {health.database}
                    </Badge>
                    <Badge>as: {health.authenticatedAs}</Badge>
                  </Flex>
                  <Text color="fg.muted" fontSize="sm">
                    checked at {health.time}
                  </Text>
                </Stack>
              ) : (
                <Spinner size="sm" />
              )}
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Container>
  )
}
