# Audiveris OMR Status

## What's Working
- Audiveris 5.5.3 JARs extracted to `/tmp/opt/audiveris/lib/app/`
- Runs on ARM64 via system Java 21
- Staff JPG preprocessing pipeline working
- Full pipeline: staff JPG → Audiveris → MXL → xml2abc.py → ABC (wired into /api/dev/test-ocr?mode=audiveris)

## Dev Compare Tool
- `/dev/notation-compare` shows all 4 sources: DB, Staff/Claude, Sol-fa/Claude, Audiveris
- abcjs player on all ABC sections
- YouTube embeds where available
- localStorage caching per tune+mode (green dots in sidebar)

## OCR Quality Verdict (tested Effingham, Crimond, Dundee)
- V1 (current DB): wrong
- V2 (Staff → Claude vision): wrong
- V3 (Sol-fa → Claude vision): almost perfect ← WINNER
- Audiveris: useless for this image type

## Next Steps (start here in new session)
1. Add "OCR text only" panel to notation-compare
   - New API mode `ocr-text`: calls extractTuneV3 but returns raw transcription (doh, time, soprano) WITHOUT ABC conversion
   - New `SolfegeTextPanel` component: editable textarea showing raw OCR'd text, then "Convert to ABC" deterministic button
   - Cache OCR text separately from ABC in localStorage (`nc:{id}:ocr-text`)
   - File already created: `src/lib/solfege-parser.ts` (pure parser, no imports)
   - Note: Tesseract tested, NOT suitable — single-letter confusion (d→cl, m→rn), Claude is correct tool

2. Once raw OCR is verified accurate: fix conversion errors in `solFaToAbc` parser

## Solfege Parser Location
- Pure parser (no server imports): `src/lib/solfege-parser.ts` (new, created this session)
- OCR + parse together: `src/lib/ocr-solfege-v2.ts` → `extractTuneV3()`
- API endpoint: `src/app/api/dev/test-ocr/route.ts` (add `mode=ocr-text` handler)

## Run command (Audiveris)
```bash
java -Djava.awt.headless=true -Xmx1g \
  -cp "/tmp/opt/audiveris/lib/app/*" \
  Audiveris -batch -export \
  -output /tmp/audiveris-out \
  /tmp/dundee-staff-final.png
```
