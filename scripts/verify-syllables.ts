import { syllabifyForAbc } from '../src/lib/lyrics';

const psalm124b: { text: string; syl: string[] }[] = [
  { text: "Now Israel may say, and that truly,", syl: ["Now", "Is", "rael", "may", "say,", "and", "that", "tru", "ly,"] },
  { text: "If that the Lord had not our cause maintain'd;", syl: ["If", "that", "the", "Lord", "had", "not", "our", "cause", "main", "tain'd;"] },
  { text: "If that the Lord had not our right sustain'd,", syl: ["If", "that", "the", "Lord", "had", "not", "our", "right", "sus", "tain'd,"] },
  { text: "When cruel men against us furiously", syl: ["When", "cruel", "men", "gainst", "us", "fu", "rious", "ly"] },
  { text: "Rose up in wrath, to make of us their prey;", syl: ["Rose", "up", "in", "wrath,", "to", "make", "of", "us", "their", "prey;"] },
  { text: "Then certainly they had devour'd us all,", syl: ["Then", "cer", "tain", "ly", "they", "had", "de", "vour'd", "us", "all,"] },
  { text: "And swallow'd quick, for ought that we could deem;", syl: ["And", "swal", "low'd", "quick,", "for", "ought", "that", "we", "could", "deem;"] },
  { text: "Such was their rage, as we might well esteem.", syl: ["Such", "was", "their", "rage,", "as", "we", "might", "well", "es", "teem."] },
  { text: "And as fierce floods before them all things drown,", syl: ["And", "as", "fierce", "floods", "be", "fore", "them", "all", "things", "drown,"] },
  { text: "So had they brought our soul to death quite down.", syl: ["So", "had", "they", "brought", "our", "soul", "to", "death", "quite", "down."] },
  { text: "The raging streams, with their proud swelling waves,", syl: ["The", "ra", "ging", "streams,", "with", "their", "proud", "swell", "ing", "waves,"] },
  { text: "Had then our soul o'erwhelmed in the deep.", syl: ["Had", "then", "our", "soul", "o'er", "whelmed", "in", "the", "deep."] },
  { text: "But bless'd be God, who doth us safely keep,", syl: ["But", "bless'd", "be", "God,", "who", "doth", "us", "safe", "ly", "keep,"] },
  { text: "And hath not giv'n us for a living prey", syl: ["And", "hath", "not", "giv'n", "us", "for", "a", "liv", "ing", "prey"] },
  { text: "Unto their teeth, and bloody cruelty.", syl: ["Un", "to", "their", "teeth,", "and", "blood", "ly", "cru", "el", "ty."] },
  { text: "Ev'n as a bird out of the fowler's snare", syl: ["Ev'n", "as", "a", "bird", "out", "of", "the", "fol", "ler's", "snare"] },
  { text: "Escapes away, so is our soul set free;", syl: ["Es", "capes", "a", "way,", "so", "is", "our", "soul", "set", "free;"] },
  { text: "Broke are their nets, and thus escaped we.", syl: ["Broke", "are", "their", "nets,", "and", "thus", "es", "caped", "we."] },
  { text: "Therefore our help is in the Lord's great name,", syl: ["There", "fore", "our", "help", "is", "in", "the", "Lord's", "great", "name,"] },
  { text: "Who heav'n and earth by his great pow'r did frame.", syl: ["Who", "heav'n", "and", "earth", "by", "his", "great", "pow'r", "did", "frame."] },
];

const psalm148b: { text: string; syl: string[]; expected: number }[] = [
  // Stanza 1: [6,6,6,6,8,8]
  { text: "The Lord of heav'n confess,", syl: ["The", "Lord", "of", "heav'n", "confess,"], expected: 6 },
  { text: "On high his glory raise", syl: ["On", "high", "his", "glo", "ry", "raise"], expected: 6 },
  { text: "Him let all angels bless,", syl: ["Him", "let", "all", "an", "gels", "bless,"], expected: 6 },
  { text: "Him all his armies praise", syl: ["Him", "all", "his", "ar", "mies", "praise"], expected: 6 },
  { text: "Him glorify Sun, moon, and stars;", syl: ["Him", "glo", "ri", "fy", "Sun,", "moon,", "and", "stars;"], expected: 8 },
  // Stanza 2: [6,6,6,6,8,8]
  { text: "Ye higher spheres, And cloudy sky.", syl: ["Ye", "hi", "gher", "spheres,", "And", "cloud", "y", "sky."], expected: 8 },
  { text: "From God your beings are,", syl: ["From", "God", "your", "be", "ings", "are,"], expected: 6 },
  { text: "Him therefore famous make;", syl: ["Him", "there", "fore", "fa", "mous", "make;"], expected: 6 },
  { text: "You all created were,", syl: ["You", "all", "cre", "a", "ted", "were,"], expected: 6 },
  { text: "When he the word but spake.", syl: ["When", "he", "the", "word", "but", "spake."], expected: 6 },
];

let allOk = true;

console.log('=== PSALM 124b (10,10,10,10,10) ===');
psalm124b.forEach((l, i) => {
  const count = l.syl.length;
  const autoCount = syllabifyForAbc(l.text).split(/\s+/).filter(Boolean).length;
  const ok = count === 10;
  if (!ok) allOk = false;
  console.log(`Line ${String(i + 1).padStart(2)}: ${ok ? 'OK ' : 'BAD'} manual=${count} (auto=${autoCount}) | ${l.text}`);
});

console.log('\n=== PSALM 148b (66 66 88) ===');
psalm148b.forEach((l, i) => {
  const count = l.syl.length;
  const autoCount = syllabifyForAbc(l.text).split(/\s+/).filter(Boolean).length;
  const ok = count === l.expected;
  if (!ok) allOk = false;
  console.log(`Line ${String(i + 1).padStart(2)}: ${ok ? 'OK ' : 'BAD'} manual=${count} (auto=${autoCount}, want=${l.expected}) | ${l.text}`);
});

console.log(allOk ? '\nAll lines OK' : '\nSome lines BAD');
process.exit(allOk ? 0 : 1);
