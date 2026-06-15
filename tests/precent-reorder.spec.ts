// Wave 0 stub — fixme until plan 04 wires the route
import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005'

test.fixme('drag reorder persists and reverts on error', async ({ page }) => {
  // Open /precent/[id], drag a row to a new position, reload, assert order persisted.
  // On simulated API error, assert UI reverts to original order.
  await page.goto(`${BASE_URL}/precent/1`)
  // TODO: use dnd-kit drag simulation to reorder set items
  // TODO: reload and assert new order is preserved
  // TODO: simulate error and assert optimistic revert
})
