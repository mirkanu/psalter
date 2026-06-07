import postgres from 'postgres'

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const rows = await sql`SELECT name, solfege_ocr_text FROM tunes WHERE name ILIKE '%crimond%'`
  console.log(JSON.stringify(rows, null, 2))
  await sql.end()
}
main().catch(console.error)
