import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { sendEmail } from '@/lib/email'

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
    sendResetPassword: async ({ user, url }) => {
      const result = await sendEmail({
        to: user.email,
        subject: 'Reset your CPRC Psalter precentor password',
        text: [
          `Hi ${user.name ?? 'precentor'},`,
          '',
          `Someone (hopefully you) requested a password reset for the CPRC Psalter precentor account on ${user.email}.`,
          '',
          'Click the link below to choose a new password. It expires in 1 hour.',
          '',
          url,
          '',
          'If you did not request this, you can safely ignore this email.',
        ].join('\n'),
        html: `
          <p>Hi ${user.name ?? 'precentor'},</p>
          <p>Someone (hopefully you) requested a password reset for the CPRC Psalter precentor account on <strong>${user.email}</strong>.</p>
          <p>Click the link below to choose a new password. It expires in 1 hour.</p>
          <p><a href="${url}">${url}</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
      })
      // sendEmail contract: never throws. Log the result for production visibility.
      if (!result.ok) {
        console.error('[auth] password-reset email failed:', result.error)
      }
    },
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
