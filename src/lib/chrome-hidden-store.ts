'use client'

// Quick task 260712-kd1 (bug b fix): SiteHeader lives in the root layout,
// completely disconnected from SingingView's local scroll-hide state. This
// module is a tiny dependency-free external store (no zustand in this
// project) bridging the two via useSyncExternalStore, so SiteHeader can hide
// together with the singing view's top bar without becoming coupled to it.
import { useSyncExternalStore } from 'react'

let hidden = false
const listeners = new Set<() => void>()

export function setChromeHidden(v: boolean): void {
  if (v === hidden) return
  hidden = v
  for (const listener of listeners) listener()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot(): boolean {
  return hidden
}

// SSR default = visible, avoids hydration mismatch (store is only ever set
// client-side by SingingView, so the server always renders "visible").
function getServerSnapshot(): boolean {
  return false
}

export function useChromeHidden(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
