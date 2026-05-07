import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Singleton pool to prevent connection exhaustion across Next.js hot reloads.
// Connection string format: postgresql://postgres:<password>@localhost:5435/psalter
const globalForDb = globalThis as unknown as { _sql?: ReturnType<typeof postgres> }
const sql = globalForDb._sql ?? postgres(process.env.DATABASE_URL, {
  max: 5,           // hard cap per Next.js worker
  idle_timeout: 20, // release idle connections after 20s
  connect_timeout: 10,
})
if (process.env.NODE_ENV !== 'production') globalForDb._sql = sql

export const db = drizzle({ client: sql, schema })
export { sql }
