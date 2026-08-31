import { createAuthClient } from 'better-auth/react'

// The generic-oauth server plugin registers Pocket ID as a first-class
// social provider, so the base client's `signIn.social` is all we need.
export const authClient = createAuthClient()
