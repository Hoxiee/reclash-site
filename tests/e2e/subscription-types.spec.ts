import { test, expect } from '@playwright/test'
import { subscriptionTypes } from '../../shared/provider/standard'

for (const language of ['ru', 'en'] as const) {
  test(`builder exports subscription types and omits the regular badge (${language})`, async ({ page }) => {
    await page.goto(`/${language}/builder`)
    const select = page.locator('#f-subscriptionType')
    const output = page.locator('#b-code')
    const badge = page.locator('[data-subscription-type]')
    await expect(select).toHaveValue('')
    await expect(badge).toHaveCount(0)
    await expect(output).not.toContainText('ReClash-SubscriptionType')
    for (const [type, label] of Object.entries(subscriptionTypes)) {
      await select.selectOption(type)
      await expect(output).toContainText(`ReClash-SubscriptionType: ${type}`)
      await expect(badge).toHaveText(label[language])
    }
    await page.getByRole('button', { name: 'nginx', exact: true }).click()
    await expect(output).toContainText('add_header ReClash-SubscriptionType "dev" always;')
    await select.selectOption('')
    await expect(output).not.toContainText('ReClash-SubscriptionType')
    await expect(badge).toHaveCount(0)
  })

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
