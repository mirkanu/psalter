# Feature Landscape

**Domain:** Online Psalter / Hymnal with Precentor Worship Portal
**Project:** CPRC Scottish Psalter
**Researched:** 2026-05-07
**Confidence:** MEDIUM — web access blocked; findings based on domain expertise, abcjs official docs (HIGH confidence), and strong training-data knowledge of hymnary.org, psalter.app, oremus.org/hymnal, and the precentor workflow in Reformed/Presbyterian worship (MEDIUM confidence)

---

## Table Stakes

Features users expect on any online psalter or hymnal. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Psalm index / browse all 150 | Primary entry point; every psalter site has this | Low | Card or table list; sortable by number, title, meter |
| Psalm detail page with metrical lyrics | Core content; why the site exists | Low | Verse-by-verse display; Scottish Psalter versification |
| Tune name and meter displayed on psalm | Users pick versions by meter/tune | Low | e.g. "CM" (Common Meter), tune = DUNDEE |
| Score / notation display | Every hymnal site shows the music | Medium | This is where abcjs replaces the current JPG images |
| Search by psalm number | Most direct lookup method | Low | Number input → psalm page |
| Search by keyword in lyrics | Users know fragments of text | Medium | Full-text search over all metrical verses |
| Search by topic / theme | Common in devotional use | Low-Medium | Topical index already exists in Airtable |
| Daily reading plan | 365-day plan is existing content; users expect continuity | Low | Day-of-year or calendar-based navigation |
| Mobile-readable layout | Congregation members use phones in pews and at home | Medium | Responsive abcjs rendering is supported (`responsive: "resize"`) |
| Print-friendly psalm page | Congregation prints for use in worship / study | Medium | CSS print stylesheet; hide nav, render full lyrics |

---

## Differentiators

Features that set this psalter apart from static or generic hymnal sites.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Live abcjs notation rendering** | Replaces brittle JPG images with scalable, correct, in-browser SVG notation — loads instantly, looks professional, works offline after initial load | High | Core flagship feature. abcjs `renderAbc()` with `responsive: "resize"`. Melody-only is correct scope (public domain). |
| **Hymnal-style layout: notation above, verse lyrics below** | How precentors and congregation expect to read music — identical to a physical psalter book. Verses numbered beneath the staff, not interleaved syllable-by-syllable under notes. | Medium | abcjs renders `w:` lyrics under each staff line (syllable-level). For hymnal layout, render ONLY verse 1 under the notation (as a guide), then display full verse text as a separate block below the notation SVG. This is the standard Scottish Psalter presentation. |
| **Precentor service event portal** | No printed booklet or static PDF can do this: a precentor builds the service set list digitally and then follows it live with rendered notation | High | Login-gated; create event → assign psalm+tune pairs → service view |
| **Live service view with notation per slot** | During worship, precentor sees each psalm in sequence with full notation — no page-flipping, no loading delays | High | Route: `/service/[id]` showing ordered psalm slots, each with abcjs rendered tune. Must be fast (skeleton loading, pre-render notation on service load). |
| **abcjs audio playback (tune preview)** | Precentors can hear the tune before the service to confirm pitch / familiarity. Congregation can hear unfamiliar psalms. | Medium | abcjs `ABCJS.synth.CreateSynth()` with Web Audio API. Requires user gesture to start. Falls back gracefully if Web Audio unsupported. |
| **Theological metadata tabs** | Study, Messianic, Doctrines tabs on psalm detail — unique among psalter sites, reflects CPRC's scholarly emphasis | Medium | Data already exists; presentation is the work |
| **Messianic classification display** | Psalm type/reference classification useful for sermon prep and devotional reading; rare in online psalters | Low | Data exists; render clearly on psalm detail |
| **Section headings within psalm** | Shows psalm structure at a glance; most online psalters omit this | Low | Data exists in `Section Headings` table |
| **Nave's Topical Concordance cross-references** | Links individual verses to topical entries — valuable for Bible study | Medium | Data in `Topics - Verses (Nave's)` table; render as expandable list on verse/psalm detail |
| **Tune mood tags** | Helps precentors choose appropriate tune for a service season | Low | Data in `Moods` table; display as tags on tune page |
| **Haddington introduction per psalm** | Scholarly devotional notes — rare in free online psalters | Low | Data in `Psalms` table; display in Study tab |
| **Historical service record** | Past service usage (which psalm/tune pairs were used on which date) is useful for precentors tracking rotation | Low | Data already in `Psalm & Tune CPRC` table; expose as filterable list |

---

## Anti-Features

Features to explicitly NOT build in v1. Each would add scope, cost, or risk without proportionate benefit.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Four-part SATB harmonisation rendering | Copyright status unresolved on harmonisations; abcjs can render them but legal risk is real | Defer until copyright confirmed; melody-only is safe and sufficient for precentors |
| User accounts / congregation favourites | Adds auth complexity, privacy concerns, GDPR surface area; low v1 priority | Defer to future milestone as explicitly scoped out |
| In-app ABC notation editor | Precentors don't need to edit notation; it's a data-entry problem for admins | ABC is sourced/encoded as a data migration task; admin edits via Airtable |
| Custom admin UI (Directus/NocoDB) | Airtable already works for editorial; building an admin UI is a project in itself | Continue using Airtable for admin; add custom admin UI post-launch if needed |
| Social sharing / comments | No congregation need identified; adds moderation burden | Static share URLs (deep link to psalm) are sufficient |
| Multi-denomination / multi-psalter support | CPRC uses Scottish Psalter exclusively; generalisation adds schema and UI complexity | Design data model cleanly but don't abstract prematurely |
| Offline PWA / service worker caching | Adds complexity; precentors need live service view but wifi is available in church | Use Next.js build caching and fast loads instead; revisit if offline need is identified |
| Transposition controls | Congregations use fixed keys; transposing the printed tune is uncommon in Scottish Psalter tradition | Not in scope; would require ABC manipulation per-render |
| Congregation member login (v1) | Explicitly deferred; adds auth, session, profile management surface | Session-less for public; precentor login only |

---

## Precentor Workflow: What Makes This Indispensable

This section focuses specifically on research question 2: what precentors need during a live service, and what makes the digital tool beat a printed booklet.

### What a precentor does

A precentor leads unaccompanied congregational singing in a Reformed/Presbyterian service. Before the service: selects which psalm (and which versification/tune) will be sung at each point in the order of worship. During the service: pitches the tune, sets the pace, and guides the congregation through the correct verses.

### Pain points with printed booklets and current Softr/Airtable

1. Finding the right page under time pressure in a service
2. Printed score images are small, blurry JPGs — hard to read quickly
3. No single view showing the full service set list with notation
4. No digital record of which tunes have been used (rotation awareness)
5. Softr is slow; loading a psalm page during a service is not viable

### Features that make the digital tool indispensable

| Feature | Why It Beats Printed | Complexity |
|---------|---------------------|------------|
| **Service set list view** — all assigned psalms for a service on one screen | No page-flipping; the whole service is in front of you | Medium |
| **Large, crisp notation rendering** — abcjs SVG scales to screen | Printed JPGs are small and blurry; abcjs renders sharp at any zoom | High |
| **Tap to navigate between psalm slots** in service view | Instant transition; no physical searching | Low |
| **Verse navigation** — jump to verse N directly | No counting pages or lines | Low |
| **Audio preview** before the service (not during) | Hear unfamiliar tunes; confirm starting pitch | Medium |
| **Fast loading** — skeleton placeholders, pre-rendered notation | Service cannot pause for a spinner; this must feel instant | Medium |
| **Offline-safe after initial load** — SVG notation is in DOM | Even if wifi drops during service, notation remains visible | Low (consequence of abcjs design) |
| **Historical usage log** — see last 6 uses of a psalm/tune | Avoid over-repetition in service planning | Low |
| **Tune meter filter** — find tunes that fit this psalm's meter | Planning efficiency; not available on printed index | Low |

### Service view UX requirements (non-negotiable for precentors)

- The service view must load all notation for all assigned psalms upfront — not on demand — so there is zero latency when moving between psalms during a service.
- Navigation between psalm slots must be a single tap/click.
- Text must be large enough to read at arm's length on a tablet or laptop screen.
- No login prompts, session expiry dialogs, or modal interruptions during the service view.
- Print view of the full service set list (with notation) must be clean for fallback physical copy.

---

## abcjs Notation Layout: Hymnal Standard

This section answers research question 3: the expected layout for hymnal-style display.

### What Scottish Psalter hymnals do

Physical Scottish Psalter books (e.g., the 1650 Psalter with tunes) use this layout:

1. **Tune header** — tune name, meter, key, sometimes arranger
2. **Staff notation** — typically 2-4 lines of music (melody only, or SATB)
3. **Verse 1 lyrics interleaved under staff** — syllables aligned beneath notes
4. **Remaining verses as numbered stanzas below the notation block** — plain text, not staff-aligned

### abcjs implementation of this layout

abcjs natively supports `w:` lyrics (syllable-level, under each staff line). This is the correct approach for verse 1 display — it shows how text fits the melody.

For verses 2-N, the correct approach is:

- Render notation with verse 1 `w:` lyrics in the ABC string
- Below the abcjs SVG container, render the remaining verses as a simple numbered list in HTML/Tailwind
- This matches hymnal convention and avoids cluttering the notation with all verse text

Layout hierarchy on the psalm detail tune section:

```
[Tune name + meter badge]
[abcjs SVG — melody with verse 1 lyrics beneath each staff line]
[Verse 2 text block]
[Verse 3 text block]
...
[Verse N text block]
```

For the **precentor service view**, an alternative layout is acceptable:

```
[Psalm N:V – Tune Name]
[abcjs SVG — melody only, no w: lyrics, larger staff]
[All verses as scrollable stacked blocks, verse number prominent]
```

This gives more vertical space to the notation and lets the precentor scroll verses without notation getting in the way.

### abcjs rendering options for hymnal quality

Based on confirmed abcjs documentation:

- `responsive: "resize"` — essential; notation fills container width and reflows on resize
- `expandToWidest: true` — prevents ragged right edge when lines have different note counts
- `wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 4 }` — controls layout density; 4 measures per line is standard for a hymn tune
- `staffwidth` — set via container CSS width; abcjs reads container width with `responsive: "resize"`
- `.abcjs-lyric` CSS class — style the syllable text (font, size) to match the rest of the UI

---

## Search Features: User Expectations

This section answers research question 4.

### Expected search capabilities (in priority order)

| Search Type | User Need | Complexity | Notes |
|-------------|-----------|------------|-------|
| **Psalm number** | Fastest lookup; "I want Psalm 23" | Low | Input field on every page; direct route to `/psalm/23` |
| **Keyword in metrical lyrics** | "I remember the line but not the number" | Medium | Full-text search over `Scottish Psalter` versification text. PostgreSQL `tsvector` with GIN index is sufficient; no external search engine needed at this scale. |
| **Topic / theme** | Devotional use; sermon planning; "I need a psalm on comfort" | Low | Topical index exists; render as filterable tag cloud or searchable list |
| **Tune name** | Precentors know tunes by name (DUNDEE, FRENCH, MARTYRDOM) | Low | Tune list page + search; tunes link to psalms that use them |
| **Meter** | Precentors filter tunes that fit a psalm's meter | Low | Meter is stored; filter by Common Meter, Long Meter, etc. |
| **Messianic / doctrinal tag** | Study use; sermon prep | Low | Filter on psalm list by doctrinal tag |
| **Daily reading context** | "What day is today in the plan?" | Low | Day number or date lookup; auto-show today's psalm |
| **Book of Psalms section** | "Psalms 90-106 (Book 4)" | Low | Filter by book grouping |

### What NOT to build in search

- Fuzzy / AI semantic search — PostgreSQL full-text is sufficient; semantic search adds infra cost for marginal gain
- External Algolia or Elasticsearch — 150 psalms is tiny; SQL search is fast enough and zero cost
- Voice search — no identified need

---

## Psalm Detail Page: Metadata Display Priority

This section answers research question 5.

### Tab structure (matching current site, validated by project context)

The current Airtable/Softr site uses Overview, Study, and Messianic tabs. This is a sensible pattern and should be preserved.

**Overview tab** (congregation primary use)
| Element | Priority | Notes |
|---------|----------|-------|
| Psalm title / number | Critical | Large heading |
| Book of Psalms (1-5) | High | Badge |
| Section headings | High | Inline above relevant verses |
| Full metrical lyrics | Critical | Verse-by-verse |
| Tune selector (if multiple tunes) | High | Multiple versifications may exist |
| Tune notation (abcjs) | Critical | Replaces JPG |
| Meter badge | High | CM, LM, etc. |
| Topics / themes | Medium | Tag list; links to topic filter |
| Today's daily reading indicator | Medium | "This psalm is today's reading (Day 47)" |
| Audio playback button | Medium | abcjs synth; hear the tune |

**Study tab** (congregation devotional / scholar use)
| Element | Priority | Notes |
|---------|----------|-------|
| Haddington introduction | Critical | Scholarly commentary; exists in data |
| KJV prose text | High | Original Hebrew poetry source |
| Verse-by-verse KJV + metrical comparison | Medium | Side-by-side; `Verses` table has both |
| Nave's topical cross-references | Medium | Per-verse; expandable |
| Doctrinal tags | Medium | List with links |
| Section headings in context | High | Show within the KJV text flow |

**Messianic tab** (sermon prep / apologetics use)
| Element | Priority | Notes |
|---------|----------|-------|
| Messianic type classification | Critical | Type (predictive, typological, etc.) |
| NT reference links | High | Which NT passage this psalm is cited/fulfilled in |
| Brief interpretive note | Medium | Exists in data if populated |

### What to avoid on the psalm detail page
- Inline commentary/commentary widgets pulled from third-party Bible sites — adds latency, external dependency, trust issues
- Social sharing counters or like buttons — no identified congregation need
- Cluttered sidebar with ads or unrelated content (this is a church resource)

---

## Feature Dependencies

```
Precentor service view
  → Precentor login (auth)
  → Service event creation
  → Psalm+tune assignment per service slot
  → abcjs notation rendering (must work in service view)

abcjs notation rendering
  → ABC notation data exists in DB (migration/encoding task)
  → If no ABC exists yet, falls back to JPG image (transitional)

Keyword search
  → PostgreSQL full-text index on metrical lyrics

Topic search
  → Topical index migrated from Airtable

Daily reading plan
  → 365 Days table migrated; date/day-number mapping

Audio playback (precentor tune preview)
  → abcjs rendering already working
  → Web Audio API supported in browser (graceful fallback required)
```

---

## MVP Recommendation

**Must have at launch (table stakes + core differentiators):**

1. Psalm index — browse all 150, search by number / keyword / topic
2. Psalm detail page — Overview tab with metrical lyrics, tune info, abcjs notation (or JPG fallback)
3. Daily reading plan — today's psalm prominent
4. Study and Messianic tabs (data exists; low rendering cost)
5. Precentor login + service event management + service view with notation

**Explicitly defer beyond launch:**
- Audio playback (precentor can use this later; notation is the critical tool)
- Nave's Topical Concordance verse cross-references (data exists but low urgency)
- Historical service usage log (nice-to-have for planning; not v1 critical)
- Four-part SATB rendering (blocked on copyright)
- User accounts / congregation favourites

---

## Sources

- abcjs official documentation (paulrosen/abcjs GitHub, via Context7): HIGH confidence — notation layout, `w:` lyrics, `responsive: "resize"`, audio synthesis API
- PROJECT.md (/data/home/psalter/.planning/PROJECT.md): HIGH confidence — existing data tables, current system, stated requirements
- Domain expertise: Scottish Psalter tradition, Reformed/Presbyterian precentor practice, hymnal layout conventions — MEDIUM confidence (training data; web access blocked for external verification)
- Note: Direct inspection of psalter.app, hymnary.org, oremus.org/hymnal was blocked (WebFetch denied). Findings on competitor features are based on training-data knowledge of those sites. Recommend manual spot-check of those sites to validate table-stakes assumptions.
