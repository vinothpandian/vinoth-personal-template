import { getDb, schema } from '@template/db'
import {
  hasIdentityRestriction,
  isAllowedEmail,
  isAllowedSubject,
} from '@template/domain'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { genericOAuth } from 'better-auth/plugins'

const issuer = (process.env.POCKET_ID_ISSUER_URL ?? '').replace(/\/$/, '')

const allowed = {
  email: process.env.ALLOWED_EMAIL,
  subject: process.env.ALLOWED_SUBJECT,
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // Origin checks compare the browser's Origin header against this list.
  // Trust both loopback spellings in dev so localhost vs 127.0.0.1
  // mismatches can't cause INVALID_ORIGIN.
  trustedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: { enabled: false },
  // Single-user gate. The only way a user row is ever created is the
  // Pocket ID OAuth callback, so blocking creation here means no second
  // user can ever exist. The OIDC subject is only known at account-link
  // time, so it gets its own hook below.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!hasIdentityRestriction(allowed)) {
            throw new APIError('FORBIDDEN', {
              message: 'Sign-in disabled: set ALLOWED_EMAIL or ALLOWED_SUBJECT',
            })
          }
          if (!isAllowedEmail(user.email, allowed.email)) {
            // Single-user app: log the rejected identity so a mismatch
            // between the IdP email and ALLOWED_EMAIL is easy to spot.
            console.warn(
              `Blocked sign-in: email "${user.email}" does not match ALLOWED_EMAIL`,
            )
            throw new APIError('FORBIDDEN', {
              message: 'This identity is not allowed to sign in',
            })
          }
          return { data: user }
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          if (!isAllowedSubject(account.accountId, allowed.subject)) {
            console.warn(
              `Blocked sign-in: subject "${account.accountId}" does not match ALLOWED_SUBJECT`,
            )
            throw new APIError('FORBIDDEN', {
              message: 'This identity is not allowed to sign in',
            })
          }
          return { data: account }
        },
      },
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'pocket-id',
          clientId: process.env.POCKET_ID_CLIENT_ID ?? '',
          clientSecret: process.env.POCKET_ID_CLIENT_SECRET ?? '',
          discoveryUrl: `${issuer}/.well-known/openid-configuration`,
          // Lets the server boot even when the issuer is unreachable
          // (better-auth 1.7 fetches discovery eagerly at init).
          accountIssuer: issuer,
          scopes: ['openid', 'profile', 'email'],
        },
      ],
    }),
  ],
})

export type Auth = typeof auth
