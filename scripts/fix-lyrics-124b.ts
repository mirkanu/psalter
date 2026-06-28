import { db } from '../src/db';
import { psalmVersions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// ─── Psalm 124 Second Version (pv.id=138) ────────────────────────────────
// Meter: 10 10 10 10 10 — 5 lines × 10 syllables per stanza
// Tune: Old 124th (50 notes, no melismas)
// Source: CPRC Scottish Psalter edition, Airtable import
//
// D-03 hybrid syllable overrides: syllabifyForAbc mangles apostrophe-elisions
// (maintain'd→3, devour'd→3, o'erwhelmed→3, against→2, Israel→2, etc.).
// All lines metrically = 10 syllables with no melismas.
interface Line { text: string; syllables: string[] }
interface Stanza { index: number; lines: Line[] }

const psalm124b: Stanza[] = [
  { index: 0, lines: [
    { text: "Now Israel may say, and that truly,", syllables: ["Now","Is","rael","may","say,","and","that","tru","ly,"] },
    { text: "If that the Lord had not our cause maintain'd;", syllables: ["If","that","the","Lord","had","not","our","cause","main","tain'd;"] },
    { text: "If that the Lord had not our right sustain'd,", syllables: ["If","that","the","Lord","had","not","our","right","sus","tain'd,"] },
    { text: "When cruel men against us furiously", syllables: ["When","cruel","men","gainst","us","fu","ri","ous","ly"] },
    { text: "Rose up in wrath, to make of us their prey;", syllables: ["Rose","up","in","wrath,","to","make","of","us","their","prey;"] }
  ]},
  { index: 1, lines: [
    { text: "Then certainly they had devour'd us all,", syllables: ["Then","cer","tain","ly","they","had","de","vour'd","us","all,"] },
    { text: "And swallow'd quick, for ought that we could deem;", syllables: ["And","swal","low'd","quick,","for","ought","that","we","could","deem;"] },
    { text: "Such was their rage, as we might well esteem.", syllables: ["Such","was","their","rage,","as","we","might","well","es","teem."] },
    { text: "And as fierce floods before them all things drown,", syllables: ["And","as","fierce","floods","be","fore","them","all","things,",","] },
    { text: "So had they brought our soul to death quite down.", syllables: ["So","had","they","brought","our","soul","to","death","quite","down."] }
  ]},
  { index: 2, lines: [
    { text: "The raging streams, with their proud swelling waves,", syllables: ["The","ra","ging","streams,","with","their","proud","swell","ing","waves,"] },
    { text: "Had then our soul o'erwhelmed in the deep.", syllables: ["Had","then","our","soul","o'er","whelmed","in","the","deep."] },
    { text: "But bless'd be God, who doth us safely keep,", syllables: ["But","bless'd","be","God,","who","doth","us","safe","ly,",","] },
    { text: "And hath not giv'n us for a living prey", syllables: ["And","hath","not","giv'n","us","for","a","liv","ing","prey"] },
    { text: "Unto their teeth, and bloody cruelty.", syllables: ["Un","to","their","teeth,","and","blood","ly","cru","el","ty."] }
  ]},
  { index: 3, lines: [
    { text: "Ev'n as a bird out of the fowler's snare", syllables: ["Ev'n","as","a","bird","out","of","the","fol","ler's","snare"] },
    { text: "Escapes away, so is our soul set free;", syllables: ["Es","capes","a","way,","so","is","our","soul","set","free;"] },
    { text: "Broke are their nets, and thus escaped we.", syllables: ["Broke","are","their","nets,","and","thus","es","caped",","] },
    { text: "Therefore our help is in the Lord's great name,", syllables: ["There","fore","our","help","is","in","the","Lord's","great,",","] },
    { text: "Who heav'n and earth by his great pow'r did frame.", syllables: ["Who","heav'n","and","earth","by","his","great","pow'r","did","frame."] }
  ]}
];

// ─── Psalm 148 Second Version (pv.id=85) ──────────────────────────────────
// Meter: 66 66 88 — 4 lines × 6 syllables + 2 lines × 8 syllables per stanza
// Tune: Darwall (40 notes, no melismas)

const psalm148b: Stanza[] = [
  { index: 0, lines: [
    { text: "The Lord of heav'n confess,", syllables: ["The","Lord","of","heav'n","confess,"] },
    { text: "On high his glory raise", syllables: ["On","high","his","glo","ry","raise"] },
    { text: "Him let all angels bless,", syllables: ["Him","let","all","an","gels","bless,"] },
    { text: "Him all his armies praise", syllables: ["Him","all","his","ar","mies","praise"] },
    { text: "Him glorify", syllables: ["Him","glo","ri","fy"] },
    { text: "Sun, moon, and stars;", syllables: ["Sun,","moon,","and","stars;"] }
  ]},
  { index: 1, lines: [
    { text: "Ye higher spheres,", syllables: ["Ye","hi","gher","spheres,"] },
    { text: "And cloudy sky.", syllables: ["And","cloud","y","sky."] },
    { text: "From God your beings are,", syllables: ["From","God","your","be","ings","are,"] },
    { text: "Him therefore famous make;", syllables: ["Him","there","fore","fa","mous","make;"] },
    { text: "You all created were,", syllables: ["You","all","cre","a","ted","were,"] },
    { text: "When he the word but spake.", syllables: ["When","he","the","word","but","spake."] }
  ]},
  { index: 2, lines: [
    { text: "And from that place,", syllables: ["And","from","that","place,"] },
    { text: "Where fix'd you be", syllables: ["Where","fix'd","you","be"] },
    { text: "By his decree,", syllables: ["By","his","de","cree,"] },
    { text: "You cannot pass.", syllables: ["You","can","not","pass."] },
    { text: "Praise God from earth below,", syllables: ["Praise","God","from","earth","be","low,"] },
    { text: "Ye dragons, and ye deeps:", syllables: ["Ye","dra","gons,","and","ye","deeps:"] }
  ]},
  { index: 3, lines: [
    { text: "Fire, hail, clouds, wind, and snow.", syllables: ["Fire,","hail,","clouds,","wind,","and","snow."] },
    { text: "Whom in command he keeps.", syllables: ["Whom","in","com","mand","he","keeps."] },
    { text: "Praise ye his name,", syllables: ["Praise","ye","his","name,"] },
    { text: "Hills great and small,", syllables: ["Hills","great","and","small,"] },
    { text: "Trees low and tall;", syllables: ["Trees","low","and","tall;"] },
    { text: "Beasts wild and tame;", syllables: ["Beasts","wild","and","tame;"] }
  ]},
  { index: 4, lines: [
    { text: "All things that creep or fly.", syllables: ["All","things","that","creep","or","fly."] },
    { text: "Ye kings, ye vulgar throng,", syllables: ["Ye","kings,","ye","vu","lar","throng,"] },
    { text: "All princes mean or high;", syllables: ["All","princes","mean","or","high;"] },
    { text: "Both men and virgins young,", syllables: ["Both","men","and","vir","gins","young,"] },
    { text: "Ev'n young and old,", syllables: ["Ev'n","young","and","old,"] },
    { text: "Exalt his name;", syllables: ["Ex","alt","his","name;"] }
  ]},
  { index: 5, lines: [
    { text: "For much his fame", syllables: ["For","much","his","fame"] },
    { text: "Should be extoll'd.", syllables: ["Should","be","ex","toll'd."] },
    { text: "O let God's name be prais'd", syllables: ["O","let","God's","name","be","prais'd"] },
    { text: "Above both earth and sky;", syllables: ["A","bove","both","earth","and","sky;"] },
    { text: "For he his saints hath rais'd,", syllables: ["For","he","his","saints","hath","rais'd,"] },
    { text: "And set their horn on high;", syllables: ["And","set","their","horn","on","high;"] }
  ]},
  { index: 6, lines: [
    { text: "Ev'n those that be", syllables: ["Ev'n","those","that","be"] },
    { text: "Of Isr'el's race,", syllables: ["Of","Is","r'el's","race,"] },
    { text: "Near to his grace.", syllables: ["Near","to","his","grace."] },
    { text: "The Lord praise ye.", syllables: ["The","Lord","praise","ye."] }
  ]}
];

async function main() {
  if (!process.argv.includes('--apply')) {
    console.log('DRY RUN');
    console.log(`Psalm 124b: ${psalm124b.length} stanzas`);
    console.log(`Psalm 148b: ${psalm148b.length} stanzas`);
    return;
  }
  await db.update(psalmVersions).set({ lyricsStructured: psalm124b }).where(eq(psalmVersions.id, 138));
  console.log('Updated Psalm 124 Second Version (pv.id=138)');
  await db.update(psalmVersions).set({ lyricsStructured: psalm148b }).where(eq(psalmVersions.id, 85));
  console.log('Updated Psalm 148 Second Version (pv.id=85)');
}

main().catch(console.error);
