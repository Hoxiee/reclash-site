import { test, expect } from '@playwright/test'
import { subscriptionTypes } from '../../shared/provider/standard'

for (const language of ['ru', 'en'] as const) {
  test(`provider reference describes the shared subscription type field (${language})`, async ({ page }) => {
    await page.goto(`/${language}/reference`)
    await expect(page.locator('.ref-sec[data-ready]')).toBeAttached()
    const entry = page.locator('#h-reclash-subscriptiontype')
    await entry.locator('summary').click()
    await expect(entry).toHaveAttribute('open', '')
    await expect(entry.locator('.codeblock pre')).toContainText('reclash-subscriptiontype: test')
    for (const [type, label] of Object.entries(subscriptionTypes)) {
      await expect(entry.getByText(type, { exact: true })).toBeVisible()
      await expect(entry.getByText(label[language], { exact: true })).toBeVisible()
    }
  })
}
