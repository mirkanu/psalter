import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'node:child_process'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { tunes } from '@/db/schema'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { extractTuneV2, extractStaffToAbc, transcribeOnly } from '@/lib/ocr-solfege-v2'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function extractMelodyVoice(fullAbc: string): string {
  const lines = fullAbc.split('\n')
  const output: string[] = []
  let inHeader = true
  let inV1Content = false

  for (const line of lines) {
    const t = line.trim()
    if (inHeader) {
      if (t.startsWith('X:') || t.startsWith('T:') || t.startsWith('L:') ||
          t.startsWith('Q:')) {
        output.push(line)
      } else if (t.startsWith('M:')) {
        output.push(t === 'M:none' ? 'M:4/4' : line)
      } else if (t.startsWith('K:')) {
        output.push(t === 'K:none' ? 'K:C' : line)
      } else if (t.startsWith('V:1 ')) {
        output.push(line)
      } else if (t === 'V:1') {
        output.push(line)
        inHeader = false
        inV1Content = true
      }
      // skip %%score, I:linebreak, V:2+, etc.
    } else {
      if (t === 'V:1' || (t.startsWith('V:1') && !t.startsWith('V:1 '))) {
        output.push(line)
        inV1Content = true
      } else if (t.startsWith('V:')) {
        inV1Content = false
      } else if (inV1Content) {
        output.push(line)
      }
    }
  }

  return output.join('\n')
}

async function runAudiveris(tune: { name: string }, imagePath: string) {
  const audiverisJarDir = '/tmp/opt/audiveris/lib/app'
  if (!fs.existsSync(audiverisJarDir)) {
    throw new Error('Audiveris JARs not found at /tmp/opt/audiveris/lib/app — restart may have cleared /tmp. Re-run the Audiveris setup script.')
  }

  const tmpDir = fs.mkdtempSync('/tmp/audiveris-api-')
  try {
    const preprocessedImg = path.join(tmpDir, 'input.png')
    const outputDir = path.join(tmpDir, 'out')
    fs.mkdirSync(outputDir)

    // Preprocess: spine crop + Otsu binarize + scale to <18MP
    const preprocessPy = `
import cv2, numpy as np, sys
img = cv2.imread(sys.argv[1])
if img is None:
    raise SystemExit("Cannot read: " + sys.argv[1])
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
row_means = gray.mean(axis=1)
page_start = next((i for i in range(gray.shape[0]) if row_means[i] > 180), 0)
page = gray[page_start:, :]
_, binary = cv2.threshold(page, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
ph, pw = binary.shape
target = 18_000_000
if ph * pw > target:
    s = (target / (ph * pw)) ** 0.5
    out = cv2.resize(binary, (int(pw*s), int(ph*s)), interpolation=cv2.INTER_LANCZOS4)
else:
    out = binary
cv2.imwrite(sys.argv[2], out)
`.trim()

    execSync(`python3 -c '${preprocessPy}' "${imagePath}" "${preprocessedImg}"`, {
      stdio: 'pipe',
      timeout: 30_000,
    })

    // Run Audiveris OMR
    execSync(
      `java -Djava.awt.headless=true -Xmx1g -cp "${audiverisJarDir}/*" Audiveris -batch -export -output "${outputDir}" "${preprocessedImg}"`,
      { stdio: 'pipe', timeout: 180_000 }
    )

    // Find .mxl output
    const mxlFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.mxl'))
    if (!mxlFiles.length) {
      throw new Error('Audiveris did not produce MXL output — transcription may have failed (check staff lines are detectable in the image)')
    }

    // Extract MusicXML from MXL (zip) — write script to file to avoid shell quoting issues
    const mxlPath = path.join(outputDir, mxlFiles[0])
    const extractScript = path.join(tmpDir, 'extract.py')
    fs.writeFileSync(extractScript, [
      'import zipfile, sys',
      'with zipfile.ZipFile(sys.argv[1]) as z:',
      '    xml_files = [n for n in z.namelist() if n.endswith(".xml") and "META" not in n]',
      '    sys.stdout.buffer.write(z.read(xml_files[0]))',
    ].join('\n'))
    const rawMxml = execSync(`python3 "${extractScript}" "${mxlPath}"`, {
      stdio: 'pipe',
      timeout: 10_000,
    }).toString('utf-8')

    // Convert MusicXML → ABC via xml2abc.py
    // xml2abc.py writes {input}.abc next to the input file and also prints to stdout
    const xmlTmpPath = path.join(tmpDir, 'score.xml')
    const abcTmpPath = path.join(tmpDir, 'score.abc')
    fs.writeFileSync(xmlTmpPath, rawMxml)

    const xml2abcScript = path.join(process.cwd(), 'scripts/xml2abc.py')
    const xml2abcStdout = execSync(`python3 "${xml2abcScript}" "${xmlTmpPath}"`, {
      stdio: 'pipe',
      timeout: 15_000,
      cwd: tmpDir,
    }).toString('utf-8')

    // xml2abc.py writes {xmlTmpPath}.abc; fall back to parsing stdout if file not found
    let rawAbc: string
    if (fs.existsSync(abcTmpPath)) {
      rawAbc = fs.readFileSync(abcTmpPath, 'utf-8')
    } else {
      // Try cwd (xml2abc.py may strip directory and write to cwd)
      const cwdAbc = path.join(tmpDir, 'score.abc')
      const altAbc = fs.readdirSync(tmpDir).find(f => f.endsWith('.abc'))
      if (altAbc) {
        rawAbc = fs.readFileSync(path.join(tmpDir, altAbc), 'utf-8')
      } else if (xml2abcStdout.includes('X:')) {
        // Parse ABC from stdout (xml2abc.py echoes content)
        rawAbc = xml2abcStdout.slice(xml2abcStdout.indexOf('X:'))
      } else {
        throw new Error(`xml2abc.py did not produce output. stdout: ${xml2abcStdout.slice(0, 300)}`)
      }
    }
    const melodyAbc = extractMelodyVoice(rawAbc)

    return { abc: melodyAbc, rawAbc, rawMxml }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

export async function GET(request: NextRequest) {
  const tuneId = request.nextUrl.searchParams.get('tuneId')
  if (!tuneId) return NextResponse.json({ error: 'tuneId required' }, { status: 400 })

  const tune = await db.query.tunes.findFirst({
    where: eq(tunes.id, parseInt(tuneId)),
    columns: { id: true, name: true },
  })
  if (!tune) return NextResponse.json({ error: 'Tune not found' }, { status: 404 })

  const mode = request.nextUrl.searchParams.get('mode') ?? 'solfege'
  const slug = slugify(tune.name)
  const dir = path.join(process.cwd(), 'public/tunes')
  const staffImg = path.join(dir, `${slug}-staff-0.jpg`)
  const solfegeImg = path.join(dir, `${slug}-solfege-0.jpg`)

  if (mode === 'audiveris') {
    // Prefer staff image (has actual music staff lines Audiveris can parse)
    const imagePath = fs.existsSync(staffImg) ? staffImg
      : fs.existsSync(solfegeImg) ? solfegeImg
      : null
    if (!imagePath) {
      return NextResponse.json({ error: `No image for "${tune.name}" (slug: ${slug})` }, { status: 404 })
    }
    try {
      const result = await runAudiveris(tune, imagePath)
      return NextResponse.json({ tuneName: tune.name, ...result })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  if (mode === 'ocr-text') {
    const imagePath = fs.existsSync(solfegeImg) ? solfegeImg
      : fs.existsSync(staffImg) ? staffImg
      : null
    if (!imagePath) return NextResponse.json({ error: `No image for "${tune.name}" (slug: ${slug})` }, { status: 404 })
    try {
      const result = await transcribeOnly(tune.name, imagePath)
      return NextResponse.json({ tuneName: tune.name, ...result })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  if (mode === 'staff') {
    const imagePath = fs.existsSync(staffImg) ? staffImg
      : fs.existsSync(solfegeImg) ? solfegeImg
      : null
    if (!imagePath) return NextResponse.json({ error: `No image for "${tune.name}" (slug: ${slug})` }, { status: 404 })
    try {
      const result = await extractStaffToAbc(tune.name, imagePath)
      return NextResponse.json({ tuneName: tune.name, ...result })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  const imagePath = fs.existsSync(solfegeImg) ? solfegeImg
    : fs.existsSync(staffImg) ? staffImg
    : null
  if (!imagePath) return NextResponse.json({ error: `No image for "${tune.name}" (slug: ${slug})` }, { status: 404 })
  try {
    const result = await extractTuneV2(tune.name, imagePath)
    return NextResponse.json({ tuneName: tune.name, ...result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
