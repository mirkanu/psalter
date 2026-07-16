---
phase: quick-260716-dtm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/lyrics.ts
  - src/lib/lyrics.test.ts
autonomous: false
requirements: []
user_setup: []

must_haves:
  truths:
    - "A multi-syllable word that is capitalized in the source lyric renders capitalized in the abcjs w:-line (Staff / inline-staff view), not lowercased"
    - "A digit-glued verse-initial word (e.g. '1Before') keeps the capital on the first LETTER, not the digit"
    - "Single-syllable words and existing PSALM_SYLLABLE_OVERRIDES syllable splits are unchanged in count and hyphenation"
    - "Lyrics-only StanzaList view (verbatim line.text) is unaffected — it never lost capitalization"
  artifacts:
    - path: "src/lib/lyrics.ts"
      provides: "syllabifyForAbc that restores original-case letters onto the syllabified output"
      contains: "syllabifyForAbc"
    - path: "src/lib/lyrics.test.ts"
      provides: "Updated + new tests asserting capitalization is preserved for multi-syllable words"
      contains: "Be- fore"
  key_links:
    - from: "src/lib/abc-melisma.ts:buildWLineFromSolfa"
      to: "src/lib/lyrics.ts:syllabifyForAbc"
      via: "import + call"
      pattern: "syllabifyForAbc"
    - from: "src/lib/lyrics.ts:buildAbcWithSyllables"
      to: "src/lib/lyrics.ts:syllabifyForAbc"
      via: "internal call"
      pattern: "syllabifyForAbc"
---

<objective>
Fix verse-initial (and any capitalized) letters not capitalizing in the rendered
lyrics under the staff.

Root cause (confirmed by reproduction): `syllabifyForAbc` in `src/lib/lyrics.ts`
lowercases every word (`stripped.toLowerCase()`) before syllabifying. Only the
single-syllable branch restores the original case via `return stripped + trailing`.
For MULTI-syllable words the function returns the joined lowercased syllables, so
capitalized words lose their capital in every abcjs `w:`-line path:

- Staff view lyrics: `buildAbcWithSyllables` → `syllabifyForAbc`
- Inline-staff / solfège-driven lyrics: `buildWLineFromSolfa` (abc-melisma.ts) → `syllabifyForAbc`

This is why the bug looked intermittent: single-syllable verse openers ("Lord",
"Praise", "When") stay capitalized, but multi-syllable ones ("Before", "Because",
"According", "Threescore", "Wherefore") render lowercase.

Reproduction (already run):
  syllabifyForAbc("Before thou ever") -> "be- fore thou ever"   (WRONG — want "Be- fore …")
  syllabifyForAbc("Lord thou hast")   -> "Lord thou hast"       (correct — single-syllable path)

The lyrics_structured DB data IS correctly capitalized; the lyrics-only StanzaList
view renders `line.text` verbatim and is fine. The defect is purely in the
runtime syllabifier used by the abcjs staff render path.

Purpose: Verse/word-initial capitals appear correctly under the staff.
Output: Case-preserving `syllabifyForAbc`, corrected tests, live-verified render.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

<interfaces>
<!-- The fix point. syllabifyForAbc lowercases before syllabifying; only the
     single-syllable branch restores case. Multi-syllable branch must restore it too. -->

From src/lib/lyrics.ts:
```typescript
export function syllabifyForAbc(text: string): string
// splits on whitespace; per word:
//   - strips trailing punctuation [.,;:!?]
//   - lowerStripped = stripped.toLowerCase()
//   - syllables = PSALM_SYLLABLE_OVERRIDES[lowerStripped] ?? syllabize(lowerStripped)
//   - 0 syllables -> "" (elided, e.g. "th'")
//   - 1 syllable  -> stripped + trailing        (CASE ALREADY PRESERVED)
//   - N syllables -> lowercased syllables joined with "- "  (BUG: case lost)
```

From src/lib/abc-melisma.ts (inline-staff path — must keep working after fix):
```typescript
export function buildWLineFromSolfa(...)   // calls syllabifyForAbc(syllables) at line ~191
```
</interfaces>

<!-- Key facts for the executor:
 1. Overrides in PSALM_SYLLABLE_OVERRIDES are lowercase syllable splits of the SAME
    word (same letters, only "-"/spaces inserted). syllabize() likewise only inserts
    separators — it never changes the letters. So the joined output has the identical
    ordered letter sequence as `stripped`, just with extra non-letter separators.
    => Case can be restored by walking alphabetic characters of `stripped` and `joined`
       in parallel and copying each source letter's case onto the corresponding output
       letter. This correctly handles digit-glued prefixes ("1Before" -> "1Be- fore")
       because the digit is not a letter and is skipped.
 2. Two EXISTING tests assert the OLD lowercasing behavior as intentional and MUST be
    updated (they were codifying the bug):
      - "Prayer (capitalised) → pray- er"  (line ~153) => now "Pray- er"
      - "Righteous (capitalised) → righ- teous" (line ~192) => now "Righ- teous"
      - buildAbcWithSyllables test "empty-string portions are skipped" asserts
        wLines[0] contains "1al- pha" and wLines[1] contains "3gam" (lines ~64-67)
        => now "1Al- pha" and "3Gam".
    Also update the now-inaccurate code comments at lines ~36-38 and ~64-65. -->
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Preserve original-case letters in syllabifyForAbc + fix/extend tests</name>
  <files>src/lib/lyrics.ts, src/lib/lyrics.test.ts</files>
  <behavior>
    - syllabifyForAbc("Before thou ever") === "Be- fore thou ever"
    - syllabifyForAbc("Because a thousand") === "Be- cause a thou- sand"
    - syllabifyForAbc("According as the") === "Ac- cor- ding as the"
    - syllabifyForAbc("Prayer") === "Pray- er"        (updated from "pray- er")
    - syllabifyForAbc("Righteous") === "Righ- teous"   (updated from "righ- teous")
    - syllabifyForAbc("prayer") === "pray- er"         (lowercase input unchanged)
    - syllabifyForAbc("iniquity:") === "in- iq- ui- ty:" (punctuation + count unchanged)
    - buildAbcWithSyllables digit-glued: portion "1Alpha line one" -> w: contains "1Al- pha"
    - Single-syllable "Lord" and "Tongues" still return unchanged
  </behavior>
  <action>
    Edit the MULTI-syllable branch of `syllabifyForAbc` in src/lib/lyrics.ts (the
    branch after the `syllables.length === 1` early return, where `joined` is built).

    After building `joined` (the lowercased syllables joined with "- " plus trailing
    punctuation), restore the source word's letter casing by walking `stripped` and
    `joined` in parallel over ALPHABETIC characters only:

      - Keep an index into `stripped`. Iterate over each character of `joined`.
      - For each character of `joined` that is an ASCII letter (/[a-z]/i), advance the
        `stripped` pointer to its next alphabetic character and copy that source
        letter's exact case onto the `joined` character (i.e. if the source letter is
        uppercase, uppercase the output letter; otherwise leave as-is).
      - Non-letter characters in `joined` ("-", " ", digits, punctuation) are emitted
        unchanged and do NOT consume a `stripped` letter.
      - If `stripped` letters are exhausted before `joined` letters (defensive; should
        not happen since letters match), emit the remaining `joined` characters as-is.

    Rebuild `joined` from this case-restored character sequence and return it (with the
    trailing punctuation already included, exactly as before). Do NOT change the
    single-syllable branch, the zero-syllable (elided) branch, the override lookup, the
    punctuation stripping/re-attachment, or the whitespace splitting/joining.

    Why the parallel-letter walk (not just first-letter): it correctly handles the
    digit-glued verse prefix "1Before" (skips the digit, capitalizes "B") and any
    internal capitals, and is robust because both strings share the identical ordered
    letter sequence (syllabifier only inserts separators).

    Then update src/lib/lyrics.test.ts:
      - Change the two "(capitalised)" assertions to the new correct output:
        "Prayer" -> "Pray- er", "Righteous" -> "Righ- teous". Update their `it(...)`
        titles and inline comments to state that capitalization IS now preserved.
      - In the "empty-string portions are skipped" buildAbcWithSyllables test, change
        the expectations to "1Al- pha" and "3Gam" and fix the stale comment.
      - Fix the stale comment at the "single portion" test (~lines 36-38) that claims
        multi-syllable words are lowercased.
      - ADD a new `describe`/`it` block asserting verse-initial capitalization is
        preserved for the multi-syllable openers listed in <behavior> above
        (Before/Because/According), plus a regression assertion that lowercase input
        stays lowercase and single-syllable case is untouched.
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx vitest run src/lib/lyrics.test.ts</automated>
  </verify>
  <done>All lyrics.test.ts tests pass; multi-syllable capitalized words (incl. digit-glued "1Before") retain their capital; lowercase input and single-syllable/override counts unchanged.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Rebuilt the psalter Docker container with the case-preserving syllabifier so the
    live Staff view shows correctly capitalized verse-opening words.

    The executor MUST first rebuild + restart the container, then confirm via the
    shared Playwright daemon that a multi-syllable verse opener renders capitalized in
    a staff w:-line, before pausing for the human check. Suggested test target:
    Psalm 90 (opens "Lord, thou hast been our dwelling-place"; contains verse-initial
    multi-syllable lines such as "Before thou ever hadst brought forth" and "Because a
    thousand years appear"). Rebuild/restart from /home/services/hetzner-vps/ per
    CLAUDE.md (never cd elsewhere for docker compose). Confirm the rendered lyric text
    under the staff shows "Before" / "Because" with a capital B, not "before"/"because".
  </what-built>
  <how-to-verify>
    1. Open https://psalter.gsdlabs.dev/psalms/90 (or the psalm the executor verified).
    2. Switch to the Staff notation view (and inline-staff on mobile width).
    3. Read the lyrics printed under the notes. Confirm words that open a verse/sentence
       and are multi-syllable (e.g. "Before", "Because", "According") show a CAPITAL
       first letter — matching how they read in the plain lyrics-only view.
    4. Sanity check nothing regressed: ordinary mid-line lowercase words stay lowercase,
       syllable hyphenation still looks right, no words merged or dropped.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any word still rendering lowercase / any alignment regression.</resume-signal>
</task>

</tasks>

<verification>
- `npx vitest run src/lib/lyrics.test.ts` passes.
- Full suite sanity: `npx vitest run src/lib/lyrics.test.ts src/lib/lyrics-structured.test.ts` passes
  (structured-lyrics parser untouched, should stay green).
- Live: multi-syllable verse-opening words render capitalized under the staff.
</verification>

<success_criteria>
- Multi-syllable capitalized words (including digit-glued "1Before") render with their
  capital preserved in every abcjs w:-line path (Staff view + inline staff).
- Single-syllable words, elided words ("th'"), PSALM_SYLLABLE_OVERRIDES counts, and
  punctuation handling are all unchanged.
- Lyrics-only StanzaList view unchanged (was never broken).
- All lyrics tests pass; human confirms the live render.
</success_criteria>

<output>
After completion, create `.planning/quick/260716-dtm-fix-verse-initial-letters-not-capitalizi/260716-dtm-SUMMARY.md`
</output>
