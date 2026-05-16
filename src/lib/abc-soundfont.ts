/**
 * Shared soundfont URL used by both AbcPlayer and AbcAudioControls.
 *
 * Extracted from per-file duplicates so a future host swap (e.g. mirroring to
 * R2 or hosting locally under /public/soundfonts/) only touches one file.
 * (WR-08)
 *
 * Today this points at paulrosen's GitHub-Pages-hosted mirror of the abcjs
 * soundfont set. abcjs's synth concatenates `${SOUNDFONT_URL}<instrument>-mp3.js`
 * at load time. If this host becomes unreliable, mirror the contents at a
 * project-owned URL and update this constant.
 */
export const SOUNDFONT_URL = 'https://paulrosen.github.io/midi-js-soundfonts/abcjs/'
