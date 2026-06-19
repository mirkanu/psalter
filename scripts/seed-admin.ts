import 'dotenv/config'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

async function seedAdmin() {
  const email = process.env.PSALTER_ADMIN_EMAIL
  const password = process.env.PSALTER_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('PSALTER_ADMIN_EMAIL and PSALTER_ADMIN_PASSWORD must be set')
  }

  // Idempotent: check if admin already exists via raw Drizzle query
  // (auth.api.listUsers requires an active admin session — not available in seed context)
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing) {
    console.log('Admin already exists, skipping:', email)
    return
  }

  await auth.api.createUser({
    body: { email, password, name: 'Admin', role: 'admin' },
  })
  console.log('Admin account created:', email)
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1) })
