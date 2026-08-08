/**
 * True when a psalm's stated meter and a tune's meter genuinely disagree.
 *
 * Null-safe by design: when either meter is missing (null, undefined, or blank) this returns
 * false. Missing data must never raise a warning — only a real disagreement does.
 *
 * Extracted from src/components/precent/SetItemRow.tsx so the precentor portal and the public
 * notation views (NotationRenderer) share one implementation. See
 * .planning/phases/10-tune-data-fixes/10-RESEARCH.md § "Don't Hand-Roll".
 */
export function isMeterMismatch(
  psalmMeter: string | null | undefined,
  tuneMeter: string | null | undefined,
): boolean {
  if (!psalmMeter || !tuneMeter) return false
  return psalmMeter.trim().toUpperCase() !== tuneMeter.trim().toUpperCase()
}
