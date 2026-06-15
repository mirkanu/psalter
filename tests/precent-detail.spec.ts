// Wave 0 stub — fixme until plan 03 wires the route
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005'

test.fixme('set detail renders psalm rows and tune assignments', async ({ page }) => {
  // Open /precent/[id], assert psalm rows are rendered with tune assignment controls.
  // Assert each row shows psalm number, title, and tune selector.
  await page.goto(`${BASE_URL}/precent/1`)
  // TODO: assert psalm rows are visible with [data-psalm-row] markers
  // TODO: assert tune assignment selector is present per row
  // TODO: assert verse range input is present per row
})
