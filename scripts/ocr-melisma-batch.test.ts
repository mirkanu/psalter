/**
 * Unit tests for scripts/ocr-melisma-batch.ts — CLI gate behaviour + per-tune
 * pipeline injection. NO live Vision calls; NO real DB writes; NO real fs writes
 * (token-usage log is exercised via injected logger).
 *
 * Plan 04 of phase 04.11. Maps to D-04 (Wave A/B gate) and D-05 (validation gate).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
  assertWaveAFlags,
  processTune,
  type ProcessTuneDeps,
  logTokenUsage,
} from './ocr-melisma-batch'

// ─── Gate tests (assertWaveAFlags) ────────────────────────────────────────────

describe('assertWaveAFlags', () => {
  it('throws when --apply is set but --tune-list is missing', () => {
    expect(() =>
      assertWaveAFlags({ apply: true, tuneListPath: undefined, tuneCount: 0, waveAPassed: false }),
    ).toThrow(/tune-list/)
  })

  it('throws when Wave-B-sized list (21 entries) with --apply lacks --wave-a-passed', () => {
    expect(() =>
      assertWaveAFlags({ apply: true, tuneListPath: 'x.json', tuneCount: 21, waveAPassed: false }),
    ).toThrow(/wave-a-passed/)
  })

  it('permits Wave-A-sized list (12 entries) with --apply WITHOUT --wave-a-passed', () => {
    expect(() =>
      assertWaveAFlags({ apply: true, tuneListPath: 'x.json', tuneCount: 12, waveAPassed: false }),
    ).not.toThrow()
  })

  it('permits Wave-B-sized list with --apply AND --wave-a-passed', () => {
    expect(() =>
      assertWaveAFlags({ apply: true, tuneListPath: 'x.json', tuneCount: 138, waveAPassed: true }),
    ).not.toThrow()
  })

  it('permits dry-run regardless of size or wave-a-passed', () => {
    expect(() =>
      assertWaveAFlags({ apply: false, tuneListPath: undefined, tuneCount: 999, waveAPassed: false }),
    ).not.toThrow()
  })
})

// ─── Per-tune pipeline tests (processTune with injected mocks) ───────────────

describe('processTune (with injected mocks)', () => {
  let updateCalls: Array<{ tuneName: string; abc: string }>
  let reviewWrites: Array<{ slug: string; review: any }>
  let tokenLogCalls: Array<{ slug: string; usage: any; model: string }>
  let deps: ProcessTuneDeps

  beforeEach(() => {
    updateCalls = []
    reviewWrites = []
    tokenLogCalls = []
    deps = {
      apply: true,
      resolveTune: vi.fn(async (name: string) => ({
        id: 30,
        name,
        abcNotation: '| c d e f |\n% PHRASE_BREAK\n| g a b c |',
      })),
      resolveJpgPaths: vi.fn(async (_slug: string) => [
        '/fake/img-0.jpg',
        '/fake/img-1.jpg',
      ]),
      resolveSyllables: vi.fn(async (_tuneId: number) => [
        'The', "Lord's", 'my', 'she-', 'pherd,', "I'll", 'not', 'want.',
      ]),
      ocrFn: vi.fn(),
      builder: vi.fn(),
      updateTune: vi.fn(async (tuneName: string, abc: string) => {
        updateCalls.push({ tuneName, abc })
        return 1
      }),
      writeReview: (slug: string, review: any) => {
        reviewWrites.push({ slug, review })
      },
      logTokens: (slug: string, usage: any, model: string) => {
        tokenLogCalls.push({ slug, usage, model })
      },
      slugify: (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }
  })

  it('low-confidence OCR result → no UPDATE; status=low_confidence; review written', async () => {
    deps.ocrFn = vi.fn(async () => ({
      soprano: [
        { tok: 'c', dur: 1, underlined: false, conf: 0.5 },
        { tok: 'd', dur: 1, underlined: false, conf: 0.9 },
      ],
      raw: '{}',
      doh: 'C',
      time: '4',
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-haiku-4-5-20251001',
    }))
    const result = await processTune('Crimond', deps)
    expect(result.status).toBe('low_confidence')
    expect(updateCalls).toHaveLength(0)
    expect(reviewWrites).toHaveLength(1)
  })

  it('validation failure → no UPDATE; status=validation_failure', async () => {
    deps.ocrFn = vi.fn(async () => ({
      soprano: [
        { tok: 'c', dur: 1, underlined: false, conf: 0.95 },
        { tok: 'd', dur: 1, underlined: false, conf: 0.97 },
      ],
      raw: '{}',
      doh: 'C',
      time: '4',
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-haiku-4-5-20251001',
    }))
    deps.builder = vi.fn(() => ({
      abc: '| ... |',
      passesValidation: false,
      warnings: ['mismatch'],
      perPhrase: [],
    }))
    const result = await processTune('Crimond', deps)
    expect(result.status).toBe('validation_failure')
    expect(updateCalls).toHaveLength(0)
    expect(reviewWrites).toHaveLength(1)
    expect(reviewWrites[0].review.warnings).toContain('mismatch')
  })

  it('valid OCR + passesValidation + --apply → DB UPDATE called once with tune name', async () => {
    deps.ocrFn = vi.fn(async () => ({
      soprano: [
        { tok: 'c', dur: 1, underlined: false, conf: 0.95 },
        { tok: 'd', dur: 1, underlined: false, conf: 0.97 },
      ],
      raw: '{}',
      doh: 'C',
      time: '4',
      usage: { input_tokens: 100, output_tokens: 50 },
      model: 'claude-haiku-4-5-20251001',
    }))
    deps.builder = vi.fn(() => ({
      abc: '| c d e f |\nw: a b c d\n% PHRASE_BREAK\n| g a b c |\nw: e f g h',
      passesValidation: true,
      warnings: [],
      perPhrase: [
        { phraseIdx: 0, noteHeadCount: 4, wTokenCount: 4 },
        { phraseIdx: 1, noteHeadCount: 4, wTokenCount: 4 },
      ],
    }))
    const result = await processTune('Crimond', deps)
    expect(result.status).toBe('success')
    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0].tuneName).toBe('Crimond')
  })

  it('token-usage logger receives usage record after successful OCR', async () => {
    deps.ocrFn = vi.fn(async () => ({
      soprano: [
        { tok: 'c', dur: 1, underlined: false, conf: 0.95 },
      ],
      raw: '{}',
      doh: 'C',
      time: '4',
      usage: { input_tokens: 1234, output_tokens: 567 },
      model: 'claude-haiku-4-5-20251001',
    }))
    deps.builder = vi.fn(() => ({
      abc: '| c |\nw: a',
      passesValidation: true,
      warnings: [],
      perPhrase: [{ phraseIdx: 0, noteHeadCount: 1, wTokenCount: 1 }],
    }))
    await processTune('Crimond', deps)
    expect(tokenLogCalls).toHaveLength(1)
    expect(tokenLogCalls[0].usage.input_tokens).toBe(1234)
    expect(tokenLogCalls[0].usage.output_tokens).toBe(567)
    expect(tokenLogCalls[0].model).toBe('claude-haiku-4-5-20251001')
  })

  it('tune not found in DB → status=no_db_row; skip', async () => {
    deps.resolveTune = vi.fn(async () => null)
    const result = await processTune('GhostTune', deps)
    expect(result.status).toBe('no_db_row')
    expect(updateCalls).toHaveLength(0)
  })

  it('no JPG images → status=no_image; skip', async () => {
    deps.resolveJpgPaths = vi.fn(async () => [])
    const result = await processTune('Crimond', deps)
    expect(result.status).toBe('no_image')
    expect(updateCalls).toHaveLength(0)
  })
})

// ─── logTokenUsage filesystem behaviour ───────────────────────────────────────

describe('logTokenUsage (real fs roundtrip)', () => {
  it('appends a row with totalTokens = input + output to scripts/output/wave-a-token-usage.json', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-melisma-batch-test-'))
    const logPath = path.join(tmpDir, 'wave-a-token-usage.json')
    logTokenUsage(
      'crimond',
      { input_tokens: 1234, output_tokens: 567 },
      'claude-haiku-4-5-20251001',
      logPath,
    )
    const parsed = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].tuneSlug).toBe('crimond')
    expect(parsed[0].inputTokens).toBe(1234)
    expect(parsed[0].outputTokens).toBe(567)
    expect(parsed[0].totalTokens).toBe(1801)
    expect(parsed[0].model).toBe('claude-haiku-4-5-20251001')
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })
})
