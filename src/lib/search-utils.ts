import React from 'react'

/**
 * Extracts a short excerpt from text centred around the first occurrence of query.
 * Returns null if query is not found in text.
 */
export function buildSnippet(text: string | null, query: string, maxLen = 100): string | null {
  if (!text || !query) return null
  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lower.indexOf(lowerQuery)
  if (idx === -1) return null
  const start = Math.max(0, idx - 30)
  const end = Math.min(text.length, start + maxLen)
  let excerpt = text.slice(start, end)
  if (start > 0) excerpt = '…' + excerpt
  if (end < text.length) excerpt = excerpt + '…'
  return excerpt
}

/**
 * Splits snippet around all case-insensitive occurrences of query and wraps
 * matches in <strong>. Uses RegExp test instead of string comparison to avoid
 * failures with gi flag edge cases.
 */
export function renderSnippet(snippet: string, query: string): React.ReactNode {
  if (!query) return React.createElement('span', null, snippet)
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = snippet.split(regex).filter(Boolean)
  const matchRegex = new RegExp(`^${escaped}$`, 'i')
  return React.createElement(
    React.Fragment,
    null,
    ...parts.map((part, i) =>
      matchRegex.test(part)
        ? React.createElement('strong', { key: i }, part)
        : React.createElement('span', { key: i }, part)
    )
  )
}
