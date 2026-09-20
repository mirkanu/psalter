'use client'

// Dependency-free external store for the "Install on your phone" dialog.
// Mirrors the chrome-hidden-store pattern: keeps InstallDialogHost (mounted
// once at the root layout) decoupled from the SiteHeader menu item and the
// InstallAsAppBanner CTA, neither of which can otherwise reach the host.
//
// SSR-safe via useSyncExternalStore's `getServerSnapshot`. The store only
// ever transitions client-side, so the server always renders the closed
// dialog (host component returns null while !open).

import { useSyncExternalStore } from 'react'

let openFlag = false
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function openInstallDialog(): void {
  if (openFlag) return
  openFlag = true
  emit()
}

export function closeInstallDialog(): void {
  if (!openFlag) return
  openFlag = false
  emit()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): boolean {
  return openFlag
}

function getServerSnapshot(): boolean {
  return false
}

export function useInstallDialogOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
