export const dynamic = 'force-dynamic'
import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { fetchTuneDetail, fetchTuneBySlug, fetchTuneSlugs } from "@/db/queries/tunes"
import { fetchPsalmsByMeter, fetchPsalmListRows } from "@/db/queries/psalms"
import { deriveVersionSlug, stripStar } from "@/lib/psalm-slugs"
import { tuneNameToSlug, isNumericTuneSlug } from "@/lib/tune-slug"
import { deriveTuneJpgPages } from "@/lib/tune-jpg-urls"
import { sopranoOnly, pickAbcWithMarkers } from "@/lib/utils"
import { buildNotationRendererProps } from "@/lib/notation-renderer-props"
import { Badge } from "@/components/ui/badge"
import { TuneMiniBarSection } from "@/components/TuneMiniBarSection"
import { PsalmsByTuneSection } from "@/components/PsalmsByTuneSection"
import { TunePageTabs } from "../_components/TunePageTabs"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const slugs = await fetchTuneSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tune = isNumericTuneSlug(slug)
    ? await fetchTuneDetail(Number(slug))
    : await fetchTuneBySlug(slug)
  return {
    title: tune?.name ? `${tune.name} | CPRC Psalter Tunes` : `Tune | CPRC Psalter`,
  }
}

export default async function TunePage({ params }: PageProps) {
  const { slug } = await params

  // TUNE-05: legacy numeric ids (/tunes/169) permanently redirect to the name-based slug.
  // src/middleware.ts is the primary mechanism (issues a real HTTP 308 before any rendering
  // starts) — this branch only runs as a fallback for the WR-01 edge case where a tune name
  // itself slugifies to a bare integer, which middleware deliberately leaves unhandled to
  // avoid redirecting into another numeric-looking path. The redirect target is derived
  // server-side from the DB-looked-up tune name — never from the request — so there is no
  // open-redirect surface. isNumericTuneSlug is a strict /^\d+$/ test, so anything else falls
  // through to the slug lookup.
  if (isNumericTuneSlug(slug)) {
    const legacyId = Number(slug)
    if (!Number.isFinite(legacyId) || legacyId < 1) notFound()
    const legacyTune = await fetchTuneDetail(legacyId)
    if (!legacyTune) notFound()
    permanentRedirect(`/tunes/${tuneNameToSlug(legacyTune.name)}`)
  }

  const tune = await fetchTuneBySlug(slug)
  if (!tune) notFound()

  // Deduplicate by psalmVersion (not psalm) so 55a and 55b appear as separate cards
  interface VersionEntry {
    psalmVersionId: number
    id: number
    bibleTitle: string | null
    firstLine: string | null
    slug: string
    displayLabel: string
    isPrimary: boolean
  }
  const seenVersionIds = new Set<number>()
  const versionEntries: VersionEntry[] = []
  for (const pvt of tune.psalmVersionTunes) {
    const pv = pvt.psalmVersion
    const p = pv?.psalm
    if (!pv || p?.id == null || seenVersionIds.has(pv.id)) continue
    seenVersionIds.add(pv.id)
    const pn = pv.psalterNumber ?? ''
    const isMultiVersion = !!(pn.includes('First') || pn.includes('Second') || /\d+:\d+/.test(pn))
    const rawLabel = deriveVersionSlug(p.id, pv.psalterNumber ?? null, isMultiVersion)
    versionEntries.push({
      psalmVersionId: pv.id,
      id: p.id,
      bibleTitle: p.bibleTitle ?? null,
      firstLine: pv.firstLine ?? null,
      slug: stripStar(rawLabel),
      displayLabel: rawLabel,
      isPrimary: pvt.isPrimary ?? false,
    })
  }
  versionEntries.sort((a, b) => a.id - b.id || a.psalmVersionId - b.psalmVersionId)

  const recommendedPsalms = versionEntries.filter((e) => e.isPrimary)
  const otherPsalms = versionEntries.filter((e) => !e.isPrimary)

  // Derive staff and solfège JPEG pages from filesystem (DB columns are NULL for all tunes)
  const { staffPages, solfegePages } = deriveTuneJpgPages(tune.name)

  // All psalms with the same meter (for "Select different Psalm" dialog)
  const psalmsForMeter = tune.meter ? await fetchPsalmsByMeter(tune.meter) : []
  const allPsalmRows = await fetchPsalmListRows()

  const moods = tune.tuneMoods.map((tm) => tm.mood.name).filter(Boolean) as string[]
  const rawAbc = pickAbcWithMarkers(tune.abcSatb, tune.abcNotation)
  const bestAbc = rawAbc ? sopranoOnly(rawAbc) : null

  const firstLinkedPsalmVersion = tune.psalmVersionTunes?.[0]?.psalmVersion ?? null
  const tunesLyrics = firstLinkedPsalmVersion?.lyricsImportedRaw ?? ''

  // TPAGE-02 (Phase 16): this section uses the SAME NotationRendererClient chain as
  // /psalms/[slug]'s Study tab — page (RSC) → TuneScoreSection ('use client') →
  // NotationRendererClient (dynamic, ssr:false) → NotationRenderer (calls ABCJS.renderAbc
  // inside useEffect+useRef). TuneScoreSection is the abcjs client-only boundary required by
  // CLAUDE.md ("abcjs — Never use server-side"). showLyrics:false + renderWLineUnderStaff:false
  // (both set in the options below) suppress ALL synthetic w: line emission — no lyrics under
  // the staff, no `_` melisma marks. The tune page is the tune alone; users wanting lyrics
  // click into "Sing this tune" below the tabs.
  const notationProps = buildNotationRendererProps(
    {
      abcNotation: tune.abcNotation ?? null,
      abcSatb: tune.abcSatb ?? null,
      name: tune.name ?? null,
      meter: tune.meter ?? null,
      phraseShapeOverride: tune.phraseShapeOverride ?? null,
      doubleLength: tune.doubleLength ?? false,
      // D-02: solfegeOcrText was MISSING at this call site before Phase 11.
      solfegeOcrText: tune.solfegeOcrText ?? null,
      // Note: JPG urls come from the filesystem-derived page arrays, not the
      // (always-NULL) DB columns — see src/lib/tune-jpg-urls.ts.
      scoreJpgUrl: staffPages[0] ?? null,
      solfegeJpgUrl: solfegePages[0] ?? null,
      // Phase 16 / D-02: plumb melismaPositions so /tunes/[slug] can render `_` melisma
      // continuation marks even though the page suppresses the StanzaList panel.
      melismaPositions: tune.melismaPositions ?? null,
    },
    {
      lyrics: tunesLyrics,
      stanzaMeter: firstLinkedPsalmVersion?.meter ?? null,
      lyricsStructured: (firstLinkedPsalmVersion?.lyricsStructured ?? null) as import('@/lib/lyrics-structured').StructuredLyrics | null,
    },
    // onViewModeChange is deliberately NOT passed here — an RSC cannot serialise a function
    // across the client boundary; TuneScoreSection attaches it.
    //
    // 2026-08-27 (revsion of Phase 16 R3): the tune page now renders melisma `_`
    // marks AND native abcjs slur arcs above the staff (driven by tunes.melisma_positions
    // + wrapMelismaSlurs inside NotationRenderer). showLyrics stays false so the
    // actual lyric TEXT does not appear under the staff — only `_` continuation
    // tokens at melisma positions and the slur arc above the held note. Users
    // wanting the full sung view with words click into "Sing this tune" below
    // the tabs and pick a psalm version.
    {
      showLyrics: false,
      renderWLineUnderStaff: true,
      fallbackTuneName: `Tune ${tune.id}`,
      // 2026-08-16 (Phase 16 R3, user sign-off): drops A+/A-, Stanza nav,
      // fullscreen icon, and the bottom Play/Key/BPM/Show-original bar.
      // Keeps Staff/Solfège toggle; routes both to their JPG-fallback modes
      // when there's no abcjs to render (many tunes lack digital notation).
      tunePageMode: true,
    },
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Page-level header — independent of the tabs below so the title
          and meter badge stay visible no matter which tab is active. */}
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Tune
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            {tune.name ?? `Tune ${tune.id}`}
          </h1>
          {tune.meter && (
            <Badge variant="secondary" className="text-base px-2.5 py-0.5">
              {tune.meter}
            </Badge>
          )}
        </div>
      </header>

      {(bestAbc || tune.soundcloudUrl || tune.youtubeUrl) && (
        <div className="mb-6">
          {/* Audio player — literal document-flow placement between the tune
              name header and the tabs (Phase 16 R3 user spec). PlayMiniBar's
              'flow' variant is position:static, so the bar scrolls with the
              page rather than floating at the viewport bottom. Users see it
              immediately under the tune name, on both tabs. */}
          <TuneMiniBarSection
            abc={bestAbc}
            soundcloudUrl={tune.soundcloudUrl ?? null}
            tuneName={tune.name ?? `Tune ${tune.id}`}
            variant="flow"
          />
        </div>
      )}

      <TunePageTabs
        tuneName={tune.name ?? `Tune ${tune.id}`}
        tuneId={tune.id}
        meter={tune.meter}
        moods={moods}
        numberIn1979RpPsalter={tune.numberIn1979RpPsalter}
        numInPrcaPsalter={tune.numInPrcaPsalter}
        hasFamousHymn={tune.hasFamousHymn ?? false}
        famousHymn={tune.famousHymn}
        precentingComment={tune.precentingComment}
        notationProps={notationProps}
        staffPages={staffPages}
        solfegePages={solfegePages}
      />

      {/* Sing this tune — OUTSIDE the tabbed content (Phase 16 R3 user spec).
          Recommended Psalms + Other Psalms + "Sing to a different psalm".
          mt-12 gives the section clear vertical breathing room from whatever
          the active tab renders (notation ends ~mb-6 above the bottom of
          NotationRendererClient's own controls). */}
      <div className="mt-12">
        <PsalmsByTuneSection
          recommendedPsalms={recommendedPsalms}
          otherPsalms={otherPsalms}
          psalmsForMeter={psalmsForMeter}
          allPsalmRows={allPsalmRows}
          tuneId={tune.id}
          meter={tune.meter}
        />
      </div>
    </div>
  )
}
