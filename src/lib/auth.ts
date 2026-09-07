import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '@/db'
import * as schema from '@/db/schema'

const AUTH_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3005'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,          // AUTH-02: no self-registration
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // D-06: 30 days
    updateAge: 60 * 60 * 24,       // refresh expiry daily on use
  },
  plugins: [admin()],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: AUTH_URL,
  // Allow logins from both the canonical production domain AND any active
  // Vercel preview deployment. baseURL alone is enough for cookie scoping,
  // but Better Auth rejects requests whose Origin header isn't in the trusted
  // list — so Vercel preview URLs need to be added explicitly.
  // Patterns use Better Auth's wildcard syntax (* and ?), NOT regex.
  // See .planning/phases/17-vercel-neon-migration/17-02-SUMMARY.md
  trustedOrigins: [
    AUTH_URL,
    'https://*.vercel.app',
  ],
})
