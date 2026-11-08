import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for data-build-id="unknown" on prerendered pages.
//
// Next writes the BUILD_ID *file* late in the build: `writeBuildId` runs
// immediately before `exportApp`, i.e. just before the "Generating static
// pages" phase. layout.tsx, however, is imported much earlier, during
// "Collecting page data". A module-scope read of BUILD_ID therefore always
// misses the file, so every prerendered page ends up with
// data-build-id="unknown" — while dynamic routes, rendered per request, get
// the right value. That split is confusing to debug and defeats the stale
// -HTML check DeployStatus performs.
//
// The symptom only appears in a full production build, so a unit test cannot
// catch it. Assert the shape of the source instead.

const source = readFileSync(
  fileURLToPath(new URL('./layout.tsx', import.meta.url)),
  'utf8',
)

/** Remove block and line comments so explanatory prose cannot trip a check. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

describe('layout.tsx build id', () => {
  it('reads the build id inside the component, not at module scope', () => {
    const componentStart = source.indexOf('export default function RootLayout')
    expect(componentStart).toBeGreaterThan(-1)

    const beforeComponent = stripComments(source.slice(0, componentStart))

    // A module-scope `const buildId = getBuildId()` is exactly the bug this
    // guards against. (The function *declaration* `function getBuildId()`
    // may stay where it is — only the call has to move.)
    expect(beforeComponent).not.toMatch(/const\s+buildId\s*=/)

    const component = stripComments(source.slice(componentStart))
    expect(component).toMatch(/const\s+buildId\s*=\s*getBuildId\s*\(\s*\)/)
  })

  it('renders the build id onto the html element', () => {
    expect(stripComments(source)).toMatch(/data-build-id=\{buildId\}/)
  })

  it('reads the live slot rather than a hardcoded .next', () => {
    expect(stripComments(source)).toMatch(/from "@\/lib\/build-id"/)
  })
})
