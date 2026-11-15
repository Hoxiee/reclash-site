import { test, expect } from '@playwright/test'
import { headerReference } from '../../shared/provider/reference'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' || /hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

const hydrated = (page: import('@playwright/test').Page) => expect(page.locator('.ref-sec[data-ready]')).toBeAttached()
const cards = (page: import('@playwright/test').Page) => page.locator('details.ref-card:visible')

test('reference prerenders every header and filters by search and category', async ({ page }) => {
  await page.goto('/en/reference')
  await expect(page.locator('details.ref-card')).toHaveCount(headerReference.length)
  await hydrated(page)
  await expect(cards(page)).toHaveCount(headerReference.length)
  await expect(page.getByRole('status')).toHaveText(`All ${headerReference.length} headers`)

  await page.getByRole('searchbox', { name: 'Search headers' }).fill('reclash-config')
  await expect(cards(page)).toHaveCount(1)
  await expect(page.locator('#h-reclash-config')).toBeVisible()
  await expect(page.getByRole('status')).toHaveText(`1 of ${headerReference.length} headers`)
  await expect(page).toHaveURL(/\?q=reclash-config$/)

  await page.getByRole('button', { name: /^HWID/ }).click()
  await expect(cards(page)).toHaveCount(0)

  await page.getByRole('searchbox', { name: 'Search headers' }).fill('nothing-like-this')
  await expect(cards(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(cards(page)).toHaveCount(headerReference.length)

  await page.getByRole('button', { name: /^HWID/ }).click()
  await expect(cards(page)).toHaveCount(7)
  await expect(page).toHaveURL(/\?cat=hwid$/)
})

test('a fragment opens and reveals its header, also past a filter and on the legacy path', async ({ page }) => {
  await page.goto('/ru/reference?q=zzz#h-reclash-config')
  const hex = page.locator('#h-reclash-config')
  await expect(hex).toHaveAttribute('open', '')
  await expect(hex).toBeInViewport()
  await expect(page.getByRole('searchbox', { name: 'Поиск заголовков' })).toHaveValue('')
  await expect(hex).toContainText('HTTPS-адрес манифеста')
  await expect(hex.locator('.codeblock pre')).toContainText('reclash-config: https://nebula.example/reclash.yaml')

  await page.goto('/en/reference.html#h-x-hwid-max-devices-reached')
  await expect(page.locator('#h-x-hwid-max-devices-reached')).toHaveAttribute('open', '')
  await expect(page.locator('#h-x-hwid-max-devices-reached')).toBeInViewport()
})

test('the announce header names its manifest override in both languages', async ({ page }) => {
  for (const [language, text] of [['ru', 'Манифест перекрывает'], ['en', 'The manifest overrides']] as const) {
    await page.goto(`/${language}/reference`)
    const announcement = page.locator('#h-announce')
    await announcement.locator('summary').click()
    await expect(announcement).toContainText(text)
  }
})

test('removed appearance headers have no reference entry and the config header replaces them', async ({ page }) => {
  await page.goto('/en/reference')
  for (const name of ['view', 'powerbutton', 'background', 'widgets']) await expect(page.locator(`#h-reclash-${name}`)).toHaveCount(0)
  await expect(page.locator('#h-reclash-config')).toHaveCount(1)
})

test('cards toggle from the keyboard and the catalogue is translated', async ({ page }) => {
  await page.goto('/ru/reference')
  await hydrated(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Справочник по заголовкам')
  await expect(page.getByRole('heading', { name: 'Общие заголовки' })).toBeVisible()
  const view = page.locator('#h-reclash-config')
  await view.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(view).toHaveAttribute('open', '')
  await expect(view).toContainText('HTTPS-адрес манифеста')
  await page.keyboard.press('Enter')
  await expect(view).not.toHaveAttribute('open', '')

  await page.keyboard.press('/')
  await expect(page.getByRole('searchbox', { name: 'Поиск заголовков' })).toBeFocused()
  await page.keyboard.type('устройств')
  await expect(page.locator('#h-x-hwid-max-devices-reached')).toBeVisible()
  await expect(page.locator('#h-reclash-config')).toBeHidden()
})

test('cards collapse before closing and a category switch shows only that category', async ({ page }) => {
  await page.goto('/en/reference')
  await hydrated(page)
  // The sliding plate marks the selected filter once the page motion runtime is mounted.
  await expect(page.locator('.ref-filters .mg-ind')).toBeAttached()

  const hex = page.locator('#h-reclash-config')
  await hex.locator('summary').click()
  await expect(hex).toHaveAttribute('open', '')
  await expect(hex.locator('.codeblock pre')).toContainText('reclash-config: https://nebula.example/reclash.yaml')
  await hex.locator('summary').click()
  // The card keeps [open] while its height collapses and drops it once the spring rests.
  await expect(hex).toHaveClass(/is-closing/)
  await expect(hex).not.toHaveAttribute('open', '')
  await expect(hex).not.toHaveClass(/is-closing/)
  await expect(hex).not.toHaveAttribute('style', /height/)

  const common = page.getByRole('button', { name: /^Common/ })
  await common.click()
  await expect(common).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/\?cat=common$/)
  await expect(cards(page)).toHaveCount(await page.locator('details.ref-card[data-cat="common"]').count())
  await expect(page.locator('details.ref-card:visible:not([data-cat="common"])')).toHaveCount(0)
  await expect(page.locator('#cat-common')).toBeVisible()
  await expect(page.locator('#cat-reclash')).toBeHidden()

  await page.getByRole('button', { name: /^All/ }).click()
  await expect(cards(page)).toHaveCount(headerReference.length)
  await expect(page).not.toHaveURL(/cat=/)
})

test('reference fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/en/reference#h-reclash-config')
  await expect(page.locator('#h-reclash-config')).toHaveAttribute('open', '')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const code = page.locator('#h-reclash-config .codeblock pre')
  expect(await code.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
})
