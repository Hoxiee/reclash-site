import { test, expect } from '@playwright/test'
import { docPath } from '../../shared/docs/catalogue'
import { subscriptionTypes } from '../../shared/provider/standard'

for (const language of ['ru', 'en'] as const) {
  test(`manifest docs describe the provider type field (${language})`, async ({ page }) => {
    await page.goto(docPath(language, 'providers/manifest'))
    const row = page.locator('.hb-prose [role="row"]', { has: page.locator('code', { hasText: /^type$/ }) }).first()
    await expect(row).toBeVisible()
    for (const type of Object.keys(subscriptionTypes)) await expect(row.locator('code', { hasText: new RegExp(`^${type}$`) })).toBeVisible()
  })
}
