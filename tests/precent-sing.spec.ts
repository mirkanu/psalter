// Wave 0 stub — fixme until plan 05 wires the route
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005'

test.fixme('SingingView notation renders at the correct psalm position', async ({ page }) => {
  // Open /precent/[id]/sing, assert notation renders for the current set item.
  // Assert the correct psalm number is displayed and ABC notation SVG is present.
  await page.goto(`${BASE_URL}/precent/1/sing`)
  // TODO: assert [data-notation-body] is present and non-empty (PREC-05)
  // TODO: assert current psalm title is shown in the singing chrome
  // TODO: assert next/prev psalm navigation buttons are present
})

test.fixme('abcjs audio play button is present in precenting mode', async ({ page }) => {
  // Open /precent/[id]/sing, assert the audio play button is rendered.
  // Assert clicking play starts the abcjs synth (PREC-06).
  await page.goto(`${BASE_URL}/precent/1/sing`)
  // TODO: assert Play button is visible (data-singing-fab or audio controls)
  // TODO: assert clicking Play changes button state to pause/stop (PREC-06)
})
