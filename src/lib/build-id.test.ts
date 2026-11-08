import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getLiveBuildId, readLiveBuildId } from './build-id'

// The live build dir is NOT always `.next` — production deploys alternate
// between two slots (`.next` / `.next-build`) and PSALTER_DIST_DIR says
// which one is live. Reading a hardcoded `.next` reports the idle slot's
// build, which breaks the stale-HTML check in DeployStatus and the public
// /api/build-version cache-bust endpoint.

describe('getLiveBuildId', () => {
  let dir: string
  let originalDistDir: string | undefined

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'psalter-build-id-'))
    originalDistDir = process.env.PSALTER_DIST_DIR
    vi.spyOn(process, 'cwd').mockReturnValue(dir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(dir, { recursive: true, force: true })
    if (originalDistDir === undefined) {
      delete process.env.PSALTER_DIST_DIR
    } else {
      process.env.PSALTER_DIST_DIR = originalDistDir
    }
  })

  function writeBuildId(slot: string, id: string) {
    mkdirSync(join(dir, slot), { recursive: true })
    writeFileSync(join(dir, slot, 'BUILD_ID'), id)
  }

  it('reads BUILD_ID from the slot named by PSALTER_DIST_DIR', () => {
    writeBuildId('.next', 'idle-slot-id')
    writeBuildId('.next-build', 'live-slot-id')
    process.env.PSALTER_DIST_DIR = '.next-build'

    expect(getLiveBuildId()).toBe('live-slot-id')
  })

  it('does not read the idle slot', () => {
    writeBuildId('.next', 'idle-slot-id')
    process.env.PSALTER_DIST_DIR = '.next-build'

    // No BUILD_ID in .next-build — must not fall back to .next.
    expect(getLiveBuildId()).toBeNull()
  })

  it('falls back to .next when PSALTER_DIST_DIR is unset', () => {
    writeBuildId('.next', 'default-slot-id')
    delete process.env.PSALTER_DIST_DIR

    expect(getLiveBuildId()).toBe('default-slot-id')
  })

  it('returns null when BUILD_ID is missing', () => {
    process.env.PSALTER_DIST_DIR = '.next-build'

    expect(getLiveBuildId()).toBeNull()
  })

  it('returns null when BUILD_ID is empty', () => {
    writeBuildId('.next-build', '')
    process.env.PSALTER_DIST_DIR = '.next-build'

    expect(getLiveBuildId()).toBeNull()
  })

  it('trims surrounding whitespace', () => {
    writeBuildId('.next-build', '  padded-id\n')
    process.env.PSALTER_DIST_DIR = '.next-build'

    expect(getLiveBuildId()).toBe('padded-id')
  })

  // The build writes BUILD_ID *after* the build starts (Next runs
  // writeBuildId immediately before the "Generating static pages" phase),
  // while the layout module is imported much earlier. A read that happens
  // too early must therefore not poison the later, correct read.
  it('retries a failed read once the file appears', () => {
    process.env.PSALTER_DIST_DIR = '.next-build'

    expect(getLiveBuildId()).toBeNull()

    // The file appears later in the build — the next read must see it.
    writeBuildId('.next-build', 'late-id')

    expect(getLiveBuildId()).toBe('late-id')
  })

  it('retries an empty read once the file is filled in', () => {
    writeBuildId('.next-build', '')
    process.env.PSALTER_DIST_DIR = '.next-build'

    expect(getLiveBuildId()).toBeNull()

    writeBuildId('.next-build', 'filled-id')

    expect(getLiveBuildId()).toBe('filled-id')
  })

  it('reads the live slot on every call, with no caching', () => {
    // Regression guard: an earlier version cached successful reads, which
    // (a) pinned a stale BUILD_ID for the life of the process and (b) broke
    // tests that mock `node:fs` with a different value per assertion.
    writeBuildId('.next-build', 'first-id')
    process.env.PSALTER_DIST_DIR = '.next-build'

    expect(getLiveBuildId()).toBe('first-id')

    // The file changes under us — the next read must reflect it.
    writeBuildId('.next-build', 'second-id')

    expect(getLiveBuildId()).toBe('second-id')
  })

  it('follows PSALTER_DIST_DIR when the slot changes', () => {
    writeBuildId('.next', 'slot-a-id')
    writeBuildId('.next-build', 'slot-b-id')
    process.env.PSALTER_DIST_DIR = '.next'

    expect(getLiveBuildId()).toBe('slot-a-id')

    // Switching slots must not return the previously read value.
    process.env.PSALTER_DIST_DIR = '.next-build'
    expect(getLiveBuildId()).toBe('slot-b-id')

    process.env.PSALTER_DIST_DIR = '.next'
    expect(getLiveBuildId()).toBe('slot-a-id')
  })
})

describe('readLiveBuildId', () => {
  let dir: string
  let originalDistDir: string | undefined

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'psalter-build-id-'))
    originalDistDir = process.env.PSALTER_DIST_DIR
    vi.spyOn(process, 'cwd').mockReturnValue(dir)
    process.env.PSALTER_DIST_DIR = '.next-build'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(dir, { recursive: true, force: true })
    if (originalDistDir === undefined) {
      delete process.env.PSALTER_DIST_DIR
    } else {
      process.env.PSALTER_DIST_DIR = originalDistDir
    }
  })

  it('reports the build id on success', () => {
    mkdirSync(join(dir, '.next-build'), { recursive: true })
    writeFileSync(join(dir, '.next-build', 'BUILD_ID'), 'abc123\n')

    expect(readLiveBuildId()).toEqual({ ok: true, buildId: 'abc123' })
  })

  it('reports `missing` when the file is absent or empty', () => {
    // Absent.
    expect(readLiveBuildId()).toEqual({ ok: false, reason: 'unreadable' })

    // Present but blank.
    mkdirSync(join(dir, '.next-build'), { recursive: true })
    writeFileSync(join(dir, '.next-build', 'BUILD_ID'), '   \n')

    expect(readLiveBuildId()).toEqual({ ok: false, reason: 'missing' })
  })

  it('reports `unreadable` when the read throws', () => {
    mkdirSync(join(dir, '.next-build'), { recursive: true })
    // A directory in place of the file makes readFileSync throw EISDIR.
    mkdirSync(join(dir, '.next-build', 'BUILD_ID'))

    expect(readLiveBuildId()).toEqual({ ok: false, reason: 'unreadable' })
  })
})
