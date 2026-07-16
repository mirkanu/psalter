export const SPLIT_LEAF_NOTATION_SCALE = 1
// Fallback ONLY — used when the caller doesn't supply notationBaseSize (defensive default
// for an uncontrolled chromeless-staff caller). Matches the CURRENT inline-Staff density at
// the pre-A+/A- mobile default (mobile chromeless default baseSize was 13, scaled as
// baseSize/14). The REAL, normal-path value for inline Staff is `notationBaseSize / 14`,
// where `notationBaseSize` is driven by SingingView's existing viewport-resize proportional-
// zoom heuristic (04.9.4-03) — decoupled from the lyric-only A+/A− control, but NOT decoupled
// from viewport responsiveness (UI-SPEC §b). Do not treat this constant as the scale itself.
export const INLINE_STAFF_NOTATION_SCALE = 13 / 14

export function computeNotationScale(opts: {
  viewMode: string
  chromeless: boolean
  baseSize: number
  /** Viewport-resize-driven notation size for chromeless inline Staff (SingingView state,
   *  independent of the lyric-only `baseSize`). Ignored for all other branches. */
  notationBaseSize?: number
}): number {
  const isSplit = opts.viewMode === 'staff-split' || opts.viewMode === 'solfege-split'
  if (isSplit) return SPLIT_LEAF_NOTATION_SCALE
  // Decouple ONLY the chromeless (mobile singing) inline Staff view from the lyric-only
  // baseSize. Scale still varies with notationBaseSize (viewport-width-derived) so the
  // staff keeps rescaling on resize/orientation change — it is NOT a bare fixed constant.
  // Non-chromeless desktop /tunes/[id] staff keeps the coupled baseSize/14 behaviour (out of scope).
  if (opts.chromeless && opts.viewMode === 'staff') {
    return (opts.notationBaseSize ?? 13) / 14
  }
  return opts.baseSize / 14
}
