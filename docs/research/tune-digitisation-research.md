# Tune Digitisation Research
*Last updated: 2026-05-12 — research complete + pipeline validated*

---

## Executive Summary

**Primary source: Hymnary.org MusicXML → xml2abc → soprano extraction.**

Hymnary.org offers free public-domain MusicXML downloads for the majority of the 172 tunes. `xml2abc` v174 (pure Python, no pip needed) converts these to ABC in seconds. Both steps are **validated working on this VPS** — Dundee, Martyrdom, St Anne, and Crimond all converted successfully in this session. `xml2abc` is now saved at `/data/home/psalter/scripts/xml2abc.py`.

**Coverage estimate (realistic):**
- ~45 tunes: Hymnary MusicXML confirmed with fetch IDs recorded in Section 4
- ~35 more tunes: likely on Hymnary but slugs not yet discovered (see Appendix)
- ~10 tunes: MutopiaProject LilyPond (Dundee already has embedded ABC)
- ~20 tunes: require Audiveris OMR from JPG scans or manual transcription
- ~62 tunes (obscure): manual ABC transcription from score scans
- **Realistic total: ~110/172 (64%) automatable; 62 need manual work**

**Key findings:**
1. Hymnary slug pattern is `tunename_composer` (lowercase snake_case). Confirmed slugs for 45 tunes are in Section 4's table.
2. Some Hymnary fetch IDs are copyright-gated (Hope Publishing). Always use the highest-numbered fetch ID for a tune — Cyber Hymnal versions (IDs ~128000–145000) are consistently public domain.
3. The MutopiaProject Dundee `.ly` file embeds a complete SATB ABC directly — no conversion needed.
4. xml2abc always outputs all voices; soprano extraction requires ~10 lines of Python post-processing.
5. The Session (thesession.org) and abcnotation.com both block programmatic access. No ABC repos for Scottish psalmody exist on GitHub.

**Recommended pipeline:** Hymnary.org MusicXML → `xml2abc` → soprano-voice extraction script → manual QA in abcjs.

---

## Section 1: The Session (thesession.org)

**Status: BLOCKED — 403 Forbidden**

The Session (thesession.org) blocks all programmatic access (returns HTTP 403 for search requests regardless of User-Agent). No tune data could be retrieved.

**Assessment:** The Session is primarily an Irish/Celtic folk tune database. Scottish Psalter hymn tunes are not its focus. Even if accessible, it would have limited coverage of psalm tunes. **Not a viable source for this project.**

---

## Section 2: OpenHymnal Project

**Status: TLS error — could not fetch**

The OpenHymnal website (`openhymnal.org`) returned a TLS certificate error (`ERR_TLS_CERT_ALTNAME_INVALID`), suggesting the site may be defunct or certificate-expired.

**What OpenHymnal is:** A project that produced LilyPond source files for hymn tunes, licensed under Creative Commons. When operational, it contained hundreds of hymn tunes with LilyPond source.

**Conversion path if files are accessible:**
```
LilyPond (.ly) → MusicXML (lilypond --format=musicxml) → ABC (xml2abc)
```
Note: LilyPond's MusicXML export is limited (only available in LilyPond 2.24+). Alternative: LilyPond → MIDI → music21 → ABC (lossy).

**Alternative: check archive.org or GitHub mirror for OpenHymnal LilyPond files.**
- GitHub search returned no active OpenHymnal repo.
- Could try: `https://web.archive.org/web/*/openhymnal.org`

---

## Section 3: GitHub Repositories

**Status: Searched — no dedicated Scottish Psalter ABC repos found**

GitHub API searches performed:
- `"scottish psalter abc"` → 0 results
- `"psalm tunes abc notation"` → 0 results
- `"hymn tunes abc lilypond"` → 0 results
- `"cprc psalter"` → 0 results
- `"presbyterian psalter"` → 0 results
- `"hymn abc notation"` → 1 result (Wesley Hymnal Processor, unrelated)

**MutopiaProject** (`MutopiaProject/MutopiaProject`, 291 stars) — the most relevant GitHub source:

Tunes confirmed present as LilyPond files:
| Tune | Path in repo | Notes |
|------|-------------|-------|
| **Dundee** | `ftp/Anonymous/dundee/dundee.ly` | SATB, E♭ major, 4/4. "Includes both LilyPond notation and ABC musical notation" per summary — **file may already contain ABC!** |
| **Old 100th (original)** | `ftp/Anonymous/Old100-orig/Old100-orig.ly` | G major, 4/2, SATB |
| **Old 100th (Dowland arr.)** | `ftp/BourgeoisL/Old100/Old100.ly` | G major, 4/2, Genevan Psalter 1551 |

**MutopiaProject hymnproject collection** (`collections/hymnproject/hymnproject.ly`) contains 70+ hymn tunes including:
- Dundee, Old 100th, Old 113th, St Anne, Stuttgart, Eventide, Azmon, Ellacomb, Franconia, Woodworth, Winchester New, New Britain, and many others.

**Raw file URLs:**
```
https://raw.githubusercontent.com/MutopiaProject/MutopiaProject/master/ftp/Anonymous/dundee/dundee.ly
https://raw.githubusercontent.com/MutopiaProject/MutopiaProject/master/ftp/Anonymous/Old100-orig/Old100-orig.ly
https://raw.githubusercontent.com/MutopiaProject/MutopiaProject/master/ftp/BourgeoisL/Old100/Old100.ly
https://raw.githubusercontent.com/MutopiaProject/MutopiaProject/master/collections/hymnproject/hymnproject.ly
```

**CONFIRMED: Dundee .ly embeds full ABC notation.** The file contains the complete SATB ABC score in commented-out lines starting with `%` at the end of the file. Extraction command:
```bash
curl -s "https://raw.githubusercontent.com/MutopiaProject/MutopiaProject/master/ftp/Anonymous/dundee/dundee.ly" \
  | awk '/^% -- ABC Source file follows --/{found=1} found{sub(/^%/,""); print}'
```
This yields a complete 4-voice ABC (V:1 soprano, V:2 alto, V:3 tenor, V:4 bass) in K:Eb, M:4/4. Saved to `/data/home/psalter/.planning/research/abc-samples/dundee_satb.abc`.

---

## Section 4: Hymnary.org

**Status: MAJOR SOURCE — most MusicXML files confirmed**

Hymnary.org is the primary viable source. It hosts MusicXML files for hundreds of hymn tunes, downloadable for free at:
```
https://hymnary.org/media/fetch/{FILE_ID}
```

### Confirmed MusicXML downloads

| Tune | Hymnary Slug | MusicXML URL | Notes |
|------|-------------|-------------|-------|
| **Dundee** | `dundee_ravenscroft` | `/media/fetch/99321` | Scottish Psalter 1615, CM, E♭ major |
| **Crimond** | `CRIMOND` | `/media/fetch/132196` | CM, Jessie Irvine 1872. **Note:** fetch/98832 is Hope Publishing-gated (US/Canada only). Use fetch/132196 (Cyber Hymnal, PD) instead. |
| **St Anne** | `ST_ANNE` or `st_anne_croft` | `/media/fetch/98679` | CM, William Croft |
| **Martyrdom** | `MARTYRDOM` or `martyrdom_wilson` | `/media/fetch/99186` | CM, Hugh Wilson |
| **London New** | `LONDON_NEW` or `london_new` | `/media/fetch/129255` | CM, Scottish Psalter |
| **Old 100th** | `old_100th` | `/media/fetch/98595` | LM, Genevan Psalter |
| **Duke Street** | `duke_street_hatton` | `/media/fetch/99267` | LM, John Hatton |
| **Rockingham** | `rockingham_miller` | `/media/fetch/98697` | LM, Edward Miller |
| **Eventide** | `eventide` or `eventide_monk` | `/media/fetch/99342` | 10.10.10.10, Monk |
| **Diademata** | `DIADEMATA` or `diademata_elvey` | `/media/fetch/99483` | DSM, Elvey |
| **Aurelia** | `AURELIA_WESLEY` | `/media/fetch/99513` | 7.6.7.6 D, S Wesley |
| **Richmond** | `richmond` or `richmond_haweis` | `/media/fetch/99048` | CM, Haweis |
| **Ellacombe** | `ellacombe` | `/media/fetch/99165` | CMD, traditional |
| **Darwall** | `darwall` | `/media/fetch/224045` | 6.6.6.6.4.4.4.4, MusicXML compressed |
| **Naomi** | `naomi` | `/media/fetch/98915` | CM, Werner |
| **Wiltshire** | `wiltshire` | `/media/fetch/134176` | CM, Smart |
| **Westminster** | `westminster` | `/media/fetch/129741` | CM, Turle |
| **Evan** | `evan` | `/media/fetch/128902` | CM, Havergal arr. Mason |
| **New Britain** | `new_britain` | `/media/fetch/99402` | CM, pentatonic / Amazing Grace |
| **Dunfermline** | `DUNFERMLINE` | `/media/fetch/98903` | CM, Scottish Psalter 1615 |
| **Martyrs** | `martyrs` (redirects to `martyrs_13153`) | `/media/fetch/128958` | CM, Scottish Psalter 1615/1635 |
| **Stracathro** | `stracathro_hutcheson` | `/media/fetch/128438` | CM, C Hutcheson |
| **Coleshill** | `coleshill` or `coleshill_barton` | `/media/fetch/133793` | CM, Barton |
| **Bangor** | `bangor_tansur` | `/media/fetch/98966` | CM, William Tans'ur |
| **Glasgow** | `glasgow_moore` | `/media/fetch/128786` | CM, Thomas Moore |
| **Kilmarnock** | `kilmarnock_dougall` | `/media/fetch/129239` | CM, Neil Dougall |
| **Crediton** | `crediton_clark` | `/media/fetch/129940` | CM, Jeremiah Clark |
| **Tallis Canon** | `tallis_canon` | `/media/fetch/99339` | LM, Thomas Tallis |
| **Beatitudo** | `beatitudo_dykes` | `/media/fetch/99618` | CM, Dykes |
| **Dennis** | `dennis_nageli` | `/media/fetch/99002` | SM, Nageli |
| **Carlisle** | `carlisle_lockhart` | `/media/fetch/130019` | SM, Charles Lockhart |
| **Trentham** | `trentham_jackson` | `/media/fetch/99291` | SM, Robert Jackson |
| **St Peter** | `st_peter_reinagle` | `/media/fetch/99474` | CM, A Reinagle |
| **St Stephen** | `st_stephen_jones` | `/media/fetch/128410` | CM, William Jones |
| **St James** | `st_james_courteville` | `/media/fetch/129818` | CM, Courteville |
| **Sawley** | `sawley_walch` | `/media/fetch/129639` | CM, J Walch |
| **Salzburg** | `salzburg_hintze` | `/media/fetch/99132` | 7.7.7.7 D, J Hintze |
| **Franconia** | `franconia_konig` | `/media/fetch/128883` | SM, König |
| **Azmon** | `azmon_glaser` | `/media/fetch/99510` | CM, Glaser arr. Mason |
| **Woodworth** | `woodworth_bradbury` | `/media/fetch/98895` | LM, Bradbury |
| **Forest Green** | `forest_green_english` | `/media/fetch/102975` | CMD, English trad. |
| **Kingsfold** | `kingsfold_english` | `/media/fetch/97842` | CMD, English trad. |
| **Old 134th** | `old_134th` | `/media/fetch/97925` | (resolves to St Michael Genevan) |
| **Old 124th** | `old_124th_bourgeois` | `/media/fetch/98565` | Genevan Psalter |
| **Belmont** | `BELMONT_GARDINER` | `/media/fetch/129050` | LM, W Gardiner |
| **Leominster** | `leominster_martin` | `/media/fetch/98886` | CMD, G W Martin |
| **St Columba** | `st_columba_irish` | `/media/fetch/97931` | 8.7.8.7, Irish trad. |
| **Naomi** | `naomi` | `/media/fetch/98915` | CM, Werner |

### Confirmed NO MusicXML on Hymnary
| Tune | Hymnary Slug | Available formats | Notes |
|------|-------------|-------------------|-------|
| **Culross** | `CULROSS` | PDF, NWC, MIDI only | Scottish Psalter 1634 |
| **Stroudwater** | `stroudwater` | PDF, NWC, MIDI only | CM |
| **Silchester** | `silchester` | PDF only | SM |
| **St John (Calkin)** | `ST_JOHN_CALKIN` | PDF, audio only | |
| **Franconia** (main slug) | `franconia` | Page scan only | SM |

### Not found on Hymnary (slug not discovered)
- **Elgin** — Scottish Psalter 1615 CM tune, no slug found (tried 15+ variants)
- **French** — Scottish Psalter CM tune (same as Dundee in some traditions), no distinct slug found
- **Irish** — Irish traditional CM tune, no slug found
- **Rimington** — CM, no slug found
- **St Magnus** — CM, no slug found
- **Harington** — CM, no slug found

**Slug discovery method:** Hymnary uses lowercase snake_case slugs like `tunename_composer` or `tunename_psalter`. The search interface is not useful programmatically (returns placeholder results). The most reliable way to find slugs is to try educated guesses with HTTP status check, or browse the Hymnary Psalter Hymnal (Gray) edition which has the most complete set of Scottish tunes.

---

## Section 5: Mutopia Project

**Status: CHECKED — limited but useful**

The MutopiaProject GitHub repo (`MutopiaProject/MutopiaProject`) contains LilyPond files for:
- **Dundee** (`ftp/Anonymous/dundee/dundee.ly`) — may include embedded ABC
- **Old 100th** — two versions
- **hymnproject collection** — 70+ tunes in one LilyPond file including Dundee, Old 100th, Old 113th, St Anne, Stuttgart, Eventide, Azmon, Ellacomb, Franconia, Woodworth, Winchester New, New Britain

The Mutopia project website (mutopiaproject.org) lists only a handful of vocal hymn tunes when browsing by voice instrumentation; most of the project is instrumental music. The hymnproject collection is the most useful subset.

**Conversion from LilyPond to ABC:**
LilyPond can export MusicXML via: `lilypond -f musicxml file.ly`
Then: `python3 xml2abc.py file.xml`

However, LilyPond must be installed: `apt-get install lilypond` (available via apt, currently v2.22 on Ubuntu 22.04).

---

## Section 6: OMR Tools Assessment

### Tools available / installable on Ubuntu 22.04 (this VPS)

| Tool | Status | Notes |
|------|--------|-------|
| **xml2abc** (Wim Vree) | NOT in apt; install manually | Pure Python script, no dependencies. Download from wim.vree.org. **Already confirmed working** in previous session. |
| **abc2xml** | NOT in PATH | Companion to xml2abc, same source |
| **default-jre** | Available via apt (v1.21) | Required for Audiveris |
| **audiveris** | NOT in apt | Must download JAR from GitHub releases |
| **python3-music21** | NOT in apt | Must use pip or manual install |
| **music21** | NOT installed (python3 import fails) | Would need pip |
| **LilyPond** | Available via apt | `apt-get install lilypond` — v2.22 |
| **Audiveris** | Available as GitHub releases | Requires Java; jar downloadable |

### Recommended tool chain for this project

**Path A: Hymnary MusicXML → ABC (preferred, covers ~80 tunes)**
```bash
# Download MusicXML from Hymnary
curl -o dundee.xml "https://hymnary.org/media/fetch/99321"

# Convert with xml2abc (already working per previous session)
python3 xml2abc.py dundee.xml -o dundee.abc
```
The output will be SATB; manual post-processing needed to extract soprano melody line.

**Path B: MutopiaProject LilyPond → MusicXML → ABC (covers Dundee + hymnproject tunes)**
```bash
apt-get install lilypond
lilypond -f musicxml dundee.ly     # generates dundee.xml
python3 xml2abc.py dundee.xml -o dundee.abc
```

**Path C: Audiveris OMR on JPG scans (for tunes with no digital source)**
```bash
# Install Java
apt-get install default-jre

# Download Audiveris 5.3
wget https://github.com/Audiveris/audiveris/releases/latest/download/Audiveris-5.3.jar

# Run OMR
java -jar Audiveris-5.3.jar -batch -export -output /tmp/ scan.jpg
# Outputs MusicXML → then xml2abc
```
Audiveris accuracy on historical hymnal scans is moderate (~70-80%). Best for simple single-staff melodies; less reliable for SATB open-score.

**Path D: abcnotation.com manual search**
abcnotation.com has ~800,000 tunes but its search interface blocks programmatic access. Manual browsing may surface ABC files for Scottish tunes. Notable: the Dundee LilyPond source apparently also contains embedded ABC notation.

### Installing xml2abc without pip (this VPS)
```bash
# xml2abc is a standalone Python 3 script — no pip needed
# Download the zip (wim.vree.org/svgParse/xml2abc.py-174.zip)
curl -o /tmp/xml2abc.zip "https://wim.vree.org/svgParse/xml2abc.py-174.zip"
python3 -c "import zipfile; zipfile.ZipFile('/tmp/xml2abc.zip').extractall('/tmp/xml2abc_extract/')"
# Script is at /tmp/xml2abc_extract/xml2abc_174/xml2abc.py
```
**VALIDATED in this session.** xml2abc v174 downloaded and confirmed working. Copied to `/data/home/psalter/scripts/xml2abc.py`.

Tested conversions (all successful):
- `dundee.xml` (Hymnary fetch/99321) → 4-voice ABC, K:Eb, M:4/4 ✓
- `martyrdom.xml` (Hymnary fetch/99186) → 4-voice ABC, K:G, M:3/4 ✓
- `st_anne.xml` (Hymnary fetch/98679) → 5-voice ABC, K:C, M:4/4 ✓
- `crimond_pd.xml` (Hymnary fetch/132196) → 4-voice ABC, K:F, M:3/4 ✓

**Known xml2abc behaviour:**
- Output is always SATB (all 4 voices). No `-v N` voice-filter flag exists.
- Soprano extraction requires post-processing: collect lines before first `V:2` header.
- Outputs include lyric lines (`w:`) and chord symbols — strip if not needed for abcjs.
- Warning "Sibelius MusicXML is unreliable" appears on Hymnary files (cosmetic only, output is correct).
- `-v` flag controls volta typesetting behaviour, not voice selection.

---

## Section 7: Direct ABC Download Attempts

### abcnotation.com
All programmatic search attempts returned only the static homepage (no results). The site requires JavaScript for search and blocks server-side fetches. Manual browser search at `https://abcnotation.com/search?q=dundee` is possible but cannot be automated. **Not viable for bulk acquisition.**

### CONFIRMED: Dundee ABC embedded in MutopiaProject LilyPond
**Verified in this session.** The file `ftp/Anonymous/dundee/dundee.ly` contains a complete SATB ABC score embedded as commented lines at the end of the file (preceded by `% -- ABC Source file follows --`).

Extraction command:
```bash
curl -s "https://raw.githubusercontent.com/MutopiaProject/MutopiaProject/master/ftp/Anonymous/dundee/dundee.ly" \
  | awk '/^% -- ABC Source file follows --/{found=1} found{sub(/^%/,""); print}'
```

Soprano melody (V:1): `E4G4A4B4|E4F4G4A4|G4F4E4E4|D4E11|B4e4d4c4|B4B4=A4B4|G4F4E4E4|D4E12`  
Key: Eb, Meter: 4/4, L:1/8. Full SATB saved to `/data/home/psalter/.planning/research/abc-samples/dundee_satb.abc`.

### CONFIRMED: Crimond public domain version
**Verified in this session.** Hymnary fetch/132196 (The Cyber Hymnal, PD) converts cleanly — title "Crimond, CM", K:F, M:3/4, C:Jessie Seymour Irvine 1872.  
Full SATB saved to `/data/home/psalter/.planning/research/abc-samples/crimond_pd.abc`.

### Copyright warning: some Hymnary fetch IDs are gated
fetch/98832 (the Crimond ID shown on the main tune page) returns an HTML license-agreement form gated by Hope Publishing instead of XML. When downloading in bulk, validate that each response starts with `<?xml`. The Cyber Hymnal versions (fetch IDs 128000–145000 range) are consistently public domain and ungated.

---

## Recommended Pipeline

### Phase 1: Bulk download from Hymnary.org (~80 tunes, ~4 hours work)

1. Write a script that downloads MusicXML for all confirmed tunes:
   ```bash
   curl -o dundee.xml "https://hymnary.org/media/fetch/99321"
   # ... repeat for each tune
   ```

2. Convert each with xml2abc (at `/data/home/psalter/scripts/xml2abc.py`):
   ```bash
   python3 scripts/xml2abc.py dundee.xml
   # Writes dundee.abc alongside the input file
   ```

3. Each output will be SATB (4 voices). Extract soprano for melody-only display:
   ```python
   # xml2abc has no voice-filter flag; post-process the ABC output:
   lines = abc_text.split('\n')
   soprano = []
   in_soprano = False
   for line in lines:
       if line.startswith('V:1'):
           in_soprano = True; continue
       if line.startswith('V:') and in_soprano:
           break
       if not line.startswith('%%score') and not in_soprano:
           soprano.append(line)
       elif in_soprano and not line.startswith('w:'):
           soprano.append(line)
   ```

4. Validate in abcjs renderer. Common issues:
   - Key signature transposition (xml2abc may output in concert pitch)
   - Time signature formatting
   - **Ties vs slurs** — visually similar curved lines, musically distinct. A **tie** joins 2 notes of the same pitch (sustain — one syllable across the tie). A **slur** joins 2+ notes of different pitches (melisma — one syllable across the slur). Both affect syllable counting. xml2abc may emit them differently; verify rendering matches source. See [lyric-to-note-alignment.md §5](./lyric-to-note-alignment.md#5-beam-vs-slur-vs-tie--visually-similar-musically-distinct).
   - **Slur preservation** — slurs are the canonical MusicXML melisma marker. If xml2abc drops slurs, the resulting ABC loses melisma information and lyric alignment will be wrong. Always inspect the output ABC for slur tokens (`(...)`) where the MusicXML had `<slur>` markup. See §"Source-of-truth quality" below.
   - Anacrusis (pickup bar) handling

### Phase 2: MutopiaProject LilyPond conversion (~10 tunes)

For tunes in the hymnproject.ly but not on Hymnary:
```bash
apt-get install -y lilypond
git clone --depth=1 https://github.com/MutopiaProject/MutopiaProject /tmp/mutopia
lilypond -f musicxml /tmp/mutopia/collections/hymnproject/hymnproject.ly
python3 xml2abc.py hymnproject.xml
```

### Phase 3: Manual ABC transcription for Scottish-specific tunes (~20 tunes)

Tunes with no digital source found (Elgin, French, Culross, Rimington, St Magnus, Harington, Irish, etc.) will need manual ABC transcription. These are simple CM tunes, typically 16 bars of 4/4. An experienced user can transcribe one in 10-15 minutes.

For these, the Scottish Psalter JPG scans (already in R2 from Phase 1) are the source material. If the quality is good enough, Audiveris OMR can be attempted first.

### Phase 4: Audiveris OMR for remaining gaps

```bash
apt-get install default-jre
wget -O /tmp/audiveris.jar "https://github.com/Audiveris/audiveris/releases/download/5.3/Audiveris.jar"
java -jar /tmp/audiveris.jar -batch -export -output /tmp/abc_output/ /data/home/psalter/public/images/tunes/elgin_scan.jpg
```
Then xml2abc on the exported MusicXML.

### Coverage estimate

| Source | Tunes covered | 
|--------|--------------|
| Hymnary.org MusicXML | ~80 (confirmed for ~45, likely ~80 total) |
| MutopiaProject LilyPond | ~10 additional |
| Audiveris OMR | ~20 (variable quality) |
| Manual ABC transcription | ~20 (the obscure Scottish tunes) |
| Already done (Crimond) | 1 |
| **Total** | **~130/172 (75%)** realistic coverage |

### Resolved and remaining unknowns

**Resolved in this session:**
- Dundee .ly embeds ABC — confirmed, extracted successfully.
- xml2abc v174 works on this VPS — confirmed, 4 tunes converted.
- xml2abc `-v` flag does NOT filter voices (it controls volta typesetting). Soprano extraction requires post-processing.
- Crimond fetch/98832 is Hope Publishing-gated; fetch/132196 is public domain — confirmed.
- Hymnary downloads require no API key for public domain tunes — confirmed.

**Still unknown:**
1. **Hymnary slugs for Elgin, French, Irish, St Magnus, Harington, Rimington** — tried 15+ variants each with no match. Best next step: browse https://hymnary.org/hymnal/PH1987 (Psalter Hymnal Gray) tune index which lists all tunes with slugs.
2. **abcjs compatibility with xml2abc output** — chord notation (`[FA]`) in Crimond output may need stripping for abcjs. The Hymnary SATB files use a cleaner format. Test rendering before bulk import.
3. **Audiveris JAR URL** — the exact release URL for Audiveris 5.3 needs confirming at https://github.com/Audiveris/audiveris/releases before use.

---

## Appendix: Tune slugs requiring further discovery

The following tunes from the CPRC 172 list do not have confirmed Hymnary slugs and need investigation:

**Scottish Psalter tunes (likely on Hymnary but slug unknown):**
- Elgin (CM, 1615)
- French / Common Tune (CM, 1615) — note: possibly same as Dundee in some traditions
- Irish (CM, traditional)
- St Magnus (CM, Jeremiah Clark)
- Harington (CM, Henry Harington)
- Rimington (CM, Francis Vanderslice/L Francis)
- Stroudwater (CM, traditional) — on Hymnary but no MusicXML

**Less common tunes (may need OCR or manual transcription):**
- Abbeyville, Agawam, Alexander, Argyle, Arnold, Artaxerxes, Aspurg
- Azmon/Denfield, Bays of Harris, Belgrave, Bingham
- Boswell, Clarkeville, Comfort, Communion, Consolation, Contemplation
- Corona, Dunlapscreek, Edinburgh, Effingham, Elijah, Ericstane, Erin
- Farrant, Fountain, Gabriel, Gainsborough, Gräfenberg
- Howard, Huddersfield, Humility, I Need Thee, Israel
- Jackson, Kathrine, Lancaster, Lennox, Leuchars, Lloyd, Lynton
- Main, Moravia, New 136th, New Lydia, Newington, Norwich
- Old 29th, Old 44th, Orlington, Orton, Ostend, Praetorius
- Ravensburg, Rest, Rutherford, Selma, Sheffield, Shepherd
- Soldau, Southwark, Southwold, Spohr
- St Agnes Durham, St Andrew, St Asaph, St Bernard, St Botolph
- St Ethelreda, St Kilda, St Lawrence, St Leonard, St Mary, St Paul
- Thanksgiving, Tiverton, University, Wallace, Walton, Warwick
- Webb, Wetherby

---

## Source-of-truth quality (added 2026-05-30)

> See also: [Lyric-to-Note Alignment](./lyric-to-note-alignment.md) — canonical theory of melisma encoding across formats.

Different tune sources preserve melisma data (slurs in MusicXML, slurs in printed score, underlines in solfège) with varying reliability. This section catalogs known sources and their melisma fidelity.

### Why this matters

Slurs in MusicXML are the canonical marker for melisma — one syllable held across multiple notes. The slur-based syllable assignment algorithm (see [lyric-to-note-alignment.md §6](./lyric-to-note-alignment.md#6-slur--syllable-assignment-algorithm)) requires that slurs be present in the source data. If the source has stripped slurs, alignment cannot be performed correctly — only heuristics (with known failure modes) remain.

### Verified sources

| Source | Coverage | Melisma data | Verified by | Confidence | Pipeline status |
|---|---|---|---|---|---|
| **Dieuwe de Boer ([scottishmetricalpsalter](https://github.com/dieuwedeboer/scottishmetricalpsalter/tree/master/docs/tunes))** | 7 tunes: Crimond, Felix, Spohr, Richmond, Tallis (CM), Old100th, TallisCanon (LM) | Explicit `<slur>` markup in MusicXML | Crimond sing-tested 2026-05-30 against Eleanor Gow → exact match | **Canonical** for Crimond; other 6 pending per-tune verification | **Crimond: verified-in-DB (2026-05-30, Phase 04.10)**; Felix/Spohr/Richmond/Tallis/Old100th/TallisCanon: not yet ingested |
| **Hymnary.org MusicXML** (fetch IDs in `src/lib/hymnary-lookup.ts`) | ~50 of our CM tunes | **VARIES per tune** — must audit each | Spot-check 2026-05-30: Crimond (132196) has slurs but no lyrics; Dundee (99321) has slurs + lyrics + `<syllabic>` markup; Bangor (98966) has slurs + lyrics. The Crimond file's missing lyrics is unusual; most Hymnary files include verse text. | **Mixed** — verify slur presence per tune before relying on it | None ingested via verified pipeline |
| **Free Church of Scotland Sing Psalms Music PDF** ([praise-resources](https://freechurch.org/praise-resources/)) | All Sing Psalms tunes | Printed score with aligned syllables | Not yet audited | **Pending** | None ingested |
| **iOS Scottish Psalter app** | TBD | Screenshots showing lyric-to-note alignment | User to provide representative samples | **Pending** | Used as visual ground-truth only |
| **Eleanor Gow's published Crimond arrangement** | 1 tune (Crimond, 3/4 arrangement) | Printed score | User confirmation 2026-05-30: "I have sung it and it's perfect" | **Canonical** for Crimond | Reflected in Crimond DB row (via de Boer source) |

### Per-tune migration recipe (added 2026-05-30, Phase 04.10)

Established by the Crimond pilot. To verify-ingest a new tune from a MusicXML
source with slur markup:

1. **Commit the source file** under `.planning/research/abc-samples/{TuneName}_{source}.musicxml`
   (e.g. `Crimond_deBoer.musicxml`). Suffix distinguishes from existing files.
2. **Hard-code the stanza-1 syllable list** for the canonical psalm pairing in
   a one-off conversion script `scripts/convert-{tuneslug}-musicxml.ts`.
3. **Choose PHRASE_BREAK positions** (Phase 04.10 Open Question O-1):
   - Default: `getSplitPointsForMeter(meter, 4)` (matches the 149 other tunes)
   - Source-natural: pass `--phrase-breaks=N,N,N` to the conversion script
4. **Choose multi-stanza handling** (Phase 04.10 Open Question O-2):
   - Option A (Crimond's choice): stanza 1 verified, stanzas 2-N heuristic
   - Option B/C: deferred
5. **Run the script** without `--apply` first; visually inspect via
   `/dev/musicxml-preview` (adapted per tune)
6. **Capture rollback artifact** to `scripts/uat/baselines/{tuneslug}-abc-rollback.txt`
   BEFORE applying
7. **Apply** with `--apply` flag; verify exactly 1 row updated and only that
   row has `abc_notation LIKE '%w:%'`
8. **Build + restart**; verify deployed page contains the first-line lyric
   via `curl ... | grep -qi`
9. **Run per-tune Playwright UAT** mirroring `scripts/uat/psalm-23-crimond-verified.js`
10. **Sing-test against** the iOS Scottish Psalter app — predicate for "verified"
11. **Update this table's Pipeline status column** to mark the new tune verified

Reference: `scripts/convert-crimond-musicxml.ts` and `.planning/phases/04.10-verified-musicxml-pilot-crimond/`.

**Hard rules** (from Phase 04.10 RESEARCH.md):
- Additive only — never refactor or remove `buildWLineFromSolfa`,
  `syllabifyForAbc`, `padWLineToNoteCount`, or `splitWLineIntoChunks`.
- One row updated per pilot.
- String detection (`/^\s*w:/m`) in `NotationRenderer` is the opt-in mechanism.

### Our solfège OCR pipeline

`solfege_ocr_text` in our DB does NOT contain melisma information. The OCR prompt in `src/lib/ocr-solfege-v2.ts:70` instructed the Vision model to discard underlines (the canonical solfège melisma marker). This was based on the original guidance in `tonic-solfa-notation.md` line 146, which has now been corrected. See `lyric-to-note-alignment.md` §9 for the implications and remediation path.

### Per-tune audit needed

Before relying on any Hymnary MusicXML file for alignment, audit:

```bash
# Download
curl -sL https://hymnary.org/media/fetch/{ID} -o tune.xml
# Check for slurs and lyrics
grep -c "<slur\|<text>\|<syllabic" tune.xml
```

Files with `<text>` and `<syllabic>` markup contain explicit lyric-to-note alignment and can be used directly. Files with `<slur>` but no `<text>` (like the Crimond fetch) require running the de Boer-style algorithm to apply syllables. Files with neither cannot be used — fall back to another source.

### Forward-path options (summary)

Three paths to canonical alignment data across all our tunes (~50 CM + alt-meter):

1. **De Boer MusicXML + Hymnary MusicXML hybrid** — use de Boer's 7 verified tunes; supplement with Hymnary's slur-bearing files; identify gaps for manual work.
2. **Update OCR prompt + re-OCR** — modify `ocr-solfege-v2.ts:70` to preserve underlines as `_` suffix; re-run OCR across the corpus. Most general but costs Vision API calls.
3. **Hybrid: MusicXML where available, current heuristic for the long tail** — graceful degradation. Mark lower confidence in UI for heuristic-only tunes.

Decision and execution deferred until ground-truth verification across multiple psalm/tune pairings is complete (user is providing iOS app screenshots as additional ground truth).
