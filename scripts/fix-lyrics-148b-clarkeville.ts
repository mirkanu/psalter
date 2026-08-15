/**
 * Fix for Psalm 148 Second Version (pv.id=85) → Clarkeville
 *
 * Meter: 66 66 88 (= 6.6.6.6.8.8) — 4 lines of 6 syllables + 2 lines of 8 syllables
 *        per stanza, 5 stanzas total (200 syllables).
 *
 * Source: friendsofsabbath.org/cgmusic.com/workshop/smpsalter/psalm-148.htm
 * (Second Version, canonical CPRC-acceptable text).
 *
 * The DB raw is grouped by Bible-verse boundaries (2 lines per verse), but the
 * 8-syllable metrical lines are formed by joining adjacent indented continuation
 * lines. This script rebuilds lyricsStructured with the canonical 5-stanza
 * grouping, where each 8-syl line is the joined concatenation of its 2 raw lines.
 *
 * hand-rolled syllables[] to bypass the auto-syllabifier's 23.8% miscount rate
 * on archaic elisions ("Isr'el", "fix'd", "rais'd", "prais'd").
 */
import 'dotenv/config'
import { db } from '../src/db';
import { psalmVersions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

interface Line { text: string; syllables: string[] }
interface Stanza { index: number; lines: Line[] }

const psalm148b: Stanza[] = [
  { index: 0, lines: [
    { text: "The Lord of heav'n confess,",
      syllables: ["The", "Lord", "of", "heav'n", "con", "fess,"] },
    { text: "On high his glory raise.",
      syllables: ["On", "high", "his", "glo", "ry", "raise."] },
    { text: "Him let all angels bless,",
      syllables: ["Him", "let", "all", "an", "gels", "bless,"] },
    { text: "Him all his armies praise.",
      syllables: ["Him", "all", "his", "ar", "mies", "praise."] },
    { text: "Him glorify Sun, moon, and stars;",
      syllables: ["Him", "glo", "ri", "fy", "Sun,", "moon,", "and", "stars;"] },
    { text: "Ye higher spheres, And cloudy sky.",
      syllables: ["Ye", "high", "er", "spheres,", "And", "cloud", "y", "sky."] },
  ]},
  { index: 1, lines: [
    { text: "From God your beings are,",
      syllables: ["From", "God", "your", "be", "ings", "are,"] },
    { text: "Him therefore famous make;",
      syllables: ["Him", "there", "fore", "fa", "mous", "make;"] },
    { text: "You all created were,",
      syllables: ["You", "all", "cre", "a", "ted", "were,"] },
    { text: "When he the word but spake.",
      syllables: ["When", "he", "the", "word", "but", "spake."] },
    { text: "And from that place, Where fix'd you be",
      syllables: ["And", "from", "that", "place,", "Where", "fix'd", "you", "be"] },
    { text: "By his decree, You cannot pass.",
      syllables: ["By", "his", "de", "cree,", "You", "can", "not", "pass."] },
  ]},
  { index: 2, lines: [
    { text: "Praise God from earth below,",
      syllables: ["Praise", "God", "from", "earth", "be", "low,"] },
    { text: "Ye dragons, and ye deeps:",
      syllables: ["Ye", "dra", "gons,", "and", "ye", "deeps:"] },
    { text: "Fire, hail, clouds, wind, and snow.",
      syllables: ["Fire,", "hail,", "clouds,", "wind,", "and", "snow."] },
    { text: "Whom in command he keeps.",
      syllables: ["Whom", "in", "com", "mand", "he", "keeps."] },
    { text: "Praise ye his name, Hills great and small,",
      syllables: ["Praise", "ye", "his", "name,", "Hills", "great", "and", "small,"] },
    { text: "Trees low and tall; Beasts wild and tame;",
      syllables: ["Trees", "low", "and", "tall;", "Beasts", "wild", "and", "tame;"] },
  ]},
  { index: 3, lines: [
    { text: "All things that creep or fly.",
      syllables: ["All", "things", "that", "creep", "or", "fly."] },
    { text: "Ye kings, ye vulgar throng,",
      syllables: ["Ye", "kings,", "ye", "vul", "gar", "throng,"] },
    { text: "All princes mean or high;",
      syllables: ["All", "prin", "ces", "mean", "or", "high;"] },
    { text: "Both men and virgins young,",
      syllables: ["Both", "men", "and", "vir", "gins", "young,"] },
    { text: "Ev'n young and old, Exalt his name;",
      syllables: ["Ev'n", "young", "and", "old,", "Ex", "alt", "his", "name;"] },
    { text: "For much his fame Should be extoll'd.",
      syllables: ["For", "much", "his", "fame", "Should", "be", "ex", "toll'd."] },
  ]},
  { index: 4, lines: [
    { text: "O let God's name be prais'd",
      syllables: ["O", "let", "God's", "name", "be", "prais'd"] },
    { text: "Above both earth and sky;",
      syllables: ["A", "bove", "both", "earth", "and", "sky;"] },
    { text: "For he his saints hath rais'd,",
      syllables: ["For", "he", "his", "saints", "hath", "rais'd,"] },
    { text: "And set their horn on high;",
      syllables: ["And", "set", "their", "horn", "on", "high;"] },
    { text: "Ev'n those that be Of Isr'el's race,",
      syllables: ["Ev'n", "those", "that", "be", "Of", "Is", "r'el's", "race,"] },
    { text: "Near to his grace. The Lord praise ye.",
      syllables: ["Near", "to", "his", "grace.", "The", "Lord", "praise", "ye."] },
  ]},
];

// Expected: [6,6,6,6,8,8] per stanza, 5 stanzas.
const EXPECTED_SHAPE = [6, 6, 6, 6, 8, 8];

async function main() {
  const fail: string[] = [];
  for (const s of psalm148b) {
    if (s.lines.length !== EXPECTED_SHAPE.length) {
      fail.push(`stanza ${s.index}: line count ${s.lines.length} != ${EXPECTED_SHAPE.length}`);
    }
    for (let i = 0; i < s.lines.length; i++) {
      const expected = EXPECTED_SHAPE[i];
      const got = s.lines[i].syllables.length;
      if (got !== expected) {
        fail.push(`stanza ${s.index} line ${i} (${s.lines[i].text}): syllables=${got} expected=${expected}`);
      }
    }
  }

  if (!process.argv.includes('--apply')) {
    console.log('DRY RUN');
    console.log(`  ${psalm148b.length} stanzas, expected ${EXPECTED_SHAPE.join('/')}`);
    if (fail.length === 0) {
      console.log('  ✓ all syllable counts match expected shape');
    } else {
      console.log(`  ✗ ${fail.length} mismatch(es):`);
      for (const msg of fail) console.log(`    - ${msg}`);
      process.exit(1);
    }
    return;
  }

  if (fail.length > 0) {
    console.log(`Refusing to apply — ${fail.length} syllable mismatch(es):`);
    for (const msg of fail) console.log(`  - ${msg}`);
    process.exit(1);
  }

  await db.update(psalmVersions)
    .set({ lyricsStructured: psalm148b as any })
    .where(eq(psalmVersions.id, 85));
  console.log('Updated Psalm 148 Second Version (pv.id=85) — Clarkeville pairing, 5 stanzas [6,6,6,6,8,8]');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
