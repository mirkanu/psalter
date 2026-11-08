import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getLiveBuildId } from './build-id'

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
})
