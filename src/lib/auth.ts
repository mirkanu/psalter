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
  // Phase 18: canonical production domain only. The pre-Phase-18 wildcard
  // 'https://*.vercel.app' was added in Phase 17 for Vercel preview testing;
  // post-cutover there is no Vercel app to attack, so the wildcard is removed.
  trustedOrigins: [
    AUTH_URL,
  ],
})
