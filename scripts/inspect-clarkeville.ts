import 'dotenv/config'
import { db } from '../src/db';
import { tunes } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
const rows = await db.select().from(tunes).where(eq(tunes.name, 'Clarkeville'));
for (const r of rows) {
  console.log('id:', r.id);
  console.log('name:', r.name);
  console.log('meter:', r.meter);
  console.log('double_length:', r.meterVariant);
  console.log('phrase_shape_override:', JSON.stringify(r.phraseShapeOverride));
  console.log('melisma_positions:', JSON.stringify(r.melismaPositions));
  const abc = r.abcNotation ?? '';
  // rough note-head count
  const noteCount = (abc.match(/\b[a-g][_,\\\"']*\d*\b/g) || []).length;
  console.log('note_count (rough):', noteCount);
  console.log('abc_length:', abc.length);
  console.log('--- abc ---');
  console.log(abc);
}
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });