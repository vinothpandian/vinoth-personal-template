import { Button, Card, Center, Heading, Stack, Text } from '@chakra-ui/react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'
import { getSessionUser } from '../server/functions'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (user) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setPending(true)
    setError(null)
    const { error: signInError } = await authClient.signIn.social({
      provider: 'pocket-id',
      callbackURL: '/',
    })
    if (signInError) {
      setError(signInError.message ?? 'Sign-in failed')
      setPending(false)
    }
  }

  return (
    <Center minH="100vh">
      <Card.Root minW="sm">
        <Card.Body>
          <Stack gap="4">
            <Heading size="lg">Personal Template</Heading>
            <Text color="fg.muted">Sign in with your Pocket ID account.</Text>
            <Button onClick={signIn} loading={pending}>
              Sign in with Pocket ID
            </Button>
            {error ? <Text color="fg.error">{error}</Text> : null}
          </Stack>
        </Card.Body>
      </Card.Root>
    </Center>
  )
}
