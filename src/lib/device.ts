/**
 * iOS detection includes iPadOS 13+, which reports as "MacIntel" in the UA
 * string but is distinguishable from a real Mac by its touch support.
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * True when the site is running as an installed home-screen app rather than
 * a normal Safari/Chrome tab. `navigator.standalone` is the iOS Safari-specific
 * flag; `display-mode: standalone` covers other standalone-capable browsers.
 */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window.navigator as any).standalone === true) return true
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}
