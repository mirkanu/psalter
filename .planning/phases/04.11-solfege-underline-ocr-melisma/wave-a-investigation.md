---
phase: 04.11
plan: 05
task: 1
status: blocked
created: 2026-05-30
---

# Wave A Dry-Run Investigation — BLOCKED

## Outcome

12/12 tunes failed the dry-run gate (0 successes). Per Plan 05 Task 1, halting before any DB writes (gate is "stop if >50% non-success"; we are at 100%).

## Failure breakdown

| Tune | Status | Root cause (preliminary) |
|------|--------|--------------------------|
| Crimond | validation_failure | non-underlined tokens=10 vs syllables=8 |
| Martyrdom | low_confidence | 1 phrase only, minConf 0.80, 0 w-tokens |
| Old 100th | validation_failure | (count mismatch) |
| Crediton | validation_failure | non-underlined tokens=28 vs syllables=10 |
| Stracathro | validation_failure | (count mismatch) |
| Carlisle | validation_failure | non-underlined tokens=16 vs syllables=6 |
| Dennis | validation_failure | non-underlined tokens=32 vs syllables=6 |
| Franconia | validation_failure | non-underlined tokens=26 vs syllables=6 |
| Old 124th | error | Vision returned malformed JSON (truncated at pos 8577) |
| Duke Street | validation_failure | non-underlined tokens=23 vs syllables=8 |
| Eastgate | validation_failure | non-underlined tokens=12 vs syllables=8 |
| Woodworth | validation_failure | (count mismatch) |

## Root cause hypothesis (HIGH CONFIDENCE)

**The Vision model is confidently NOT marking underlines.** Token confidences are 0.85–0.95 across the board, yet `underlined: true` is being applied to far fewer tokens than the music actually contains. This causes `buildEmbeddedWline` to treat almost every note as needing its own syllable — i.e., the OCR output looks like a 1-syllable-per-note score, but the score is actually melismatic.

Evidence:
- Dennis SM should have ~6 syllables/line and many melismas. OCR reports 32 non-underlined tokens for 6 syllables → almost no underlines detected.
- Crediton CM extended-final-phrase should have many melismas. 28 non-underlined for 10 syllables → ~64% miss rate on underlines.
- Even Crimond — the project's gold-standard test case — shows 10 vs 8 (2 underlines missed on the simplest CM tune).

This is the EXACT failure mode CLAUDE.md hard rule #3 warned about: *"The current solfège OCR pipeline lost underline data… All current `*-melisma*` code is heuristic compensation, not canonical detection."* Plan 03's "underline-preserving" prompt has not actually solved the underlying perception problem at Haiku 4.5; the model is hallucinating an unmarked-up score.

## Secondary issue

Old 124th's response was truncated JSON (parse error at position 8577). This is likely an output-token-limit issue — the model's response exceeded the max_tokens setting in `ocrMelismaV3`. Worth raising the limit, but it's a downstream concern; the underline-detection failure is the blocker.

## Non-issues

- **Syllable resolver is correct.** Plan 04's `stanza1-probe.json` empirically verified the syllable join end-to-end for Crimond, and the syllable counts in the warnings (8 for Crimond, 6 for SM, 10 for CM extended) match the documented psalm structure. The problem is the OCR side, not the syllable side.
- **Cost** was low (~$0.12 spent — well under the rough estimate). Re-running is affordable.

## Options

1. **Switch to a stronger Vision model** (Claude Sonnet 4.6 or Opus 4.7). Haiku may not reliably perceive a thin underline stroke on dense solfège pages. Cost goes up ~6–15× but Wave A is small.
2. **Prompt-engineer harder.** Add few-shot examples of underlined vs non-underlined notes, or change the prompt to surface underline detection as a separate per-token classification pass.
3. **Two-pass OCR.** Pass 1: structural transcription (tokens + durations, what we already do well in v2). Pass 2: per-token "is this underlined?" classification with the image cropped to that note region. More API calls, but probably more reliable.
4. **Accept heuristic fallback for now.** D-05 already gives us this; just declare Phase 04.11 a "research/partial" milestone, ship the rollback recipe + the v3 module as scaffolding, and revisit when a stronger model is feasible.
5. **Bypass the count-equality validation gate** and trust the partial w-lines. Strongly discouraged — the whole point of Plan 02's invariant is to prevent silent drift; bypassing it reintroduces the bug Phase 04.11 was designed to fix.

## What I need from you

A decision on which option above to pursue (or a different angle). I will not retry the Vision call or proceed to Task 2 until directed.
