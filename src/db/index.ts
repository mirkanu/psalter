import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Connection string from DATABASE_URL env var
// Format: postgresql://postgres:postgres@localhost:5435/psalter
const sql = postgres(process.env.DATABASE_URL!)

export const db = drizzle({ client: sql })
export { sql }
