# Audiveris OMR Status

## What's Working
- Audiveris 5.5.3 JARs extracted to `/tmp/opt/audiveris/lib/app/`
- Runs on ARM64 via system Java 21 (`/tmp/opt/audiveris/lib/app/*`)
- Tesseract symlink: `/usr/lib/aarch64-linux-gnu/libtesseract.so.5.3.1 → libtesseract.so.5`
- Image preprocessing pipeline working: crop spine + Otsu binarize + scale to <18MP

## Run command
```bash
java -Djava.awt.headless=true -Xmx1g \
  -cp "/tmp/opt/audiveris/lib/app/*" \
  Audiveris -batch -export \
  -output /tmp/audiveris-out \
  /tmp/dundee-final.png
```

## Preprocessing script
```python
import cv2, numpy as np
img = cv2.imread('tune-staff-0.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
row_means = gray.mean(axis=1)
page_start = next((i for i in range(gray.shape[0]) if row_means[i] > 180), 0)
page = gray[page_start:, :]
enhanced = cv2.convertScaleAbs(page, alpha=1.4, beta=-20)
blurred = cv2.GaussianBlur(enhanced, (3,3), 0)
sharpened = cv2.addWeighted(enhanced, 1.5, blurred, -0.5, 0)
_, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
ph, pw = binary.shape
scale = (18_000_000 / (ph * pw)) ** 0.5
out = cv2.resize(binary, (int(pw*scale), int(ph*scale)), interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite('dundee-final.png', out)
```

## Current blocker
NPE in `MeasuresBuilder.emptyCourtesyMeasure` at line 347. This is a late-stage crash
(passes LOAD→BINARY→SCALE→GRID→HEADERS→STEMS→BEAMS→HEADS→MEASURES then fails).

## Next steps
1. Try Audiveris v5.4 JARs (may not have this NPE)
   - Download: https://github.com/Audiveris/audiveris/releases/tag/v5.4
2. Or try `-option` flags to skip courtesy measure processing
3. Once MusicXML exports: run `python3 scripts/xml2abc.py output.xml` to get ABC
4. Wire into `/api/dev/test-ocr?mode=audiveris` route
