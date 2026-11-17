import { test, expect, type Page } from '@playwright/test'
import { mockConfigPath, mockProfiles } from '../../shared/provider/mocks'

const keys = mockProfiles.map(profile => profile.key)
const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

async function open(page: Page, key: string) {
  await page.locator(`.mock-cat [data-stand="${key}"]`).click()
  await expect(page.locator(`#mock-${key}`)).toBeVisible()
}

for (const [language, heading] of [['ru', 'Мок-подписки'], ['en', 'Mock subscriptions']] as const) {
  test(`every stand has an import link that encodes its url and name (${language})`, async ({ page }) => {
    await page.goto(`/${language}/mock-subs`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    await expect(page.locator('.mock-warn')).toBeVisible()
    await expect(page.locator('.mock-cat [data-stand]')).toHaveCount(keys.length)
    await expect(page.locator('.mock-stand')).toHaveCount(1)
    await expect(page.locator('.mock-stand')).toHaveId('mock-halo')
    for (const profile of mockProfiles) {
      await open(page, profile.key)
      await expect(page.locator('.mock-cat [aria-current="true"]')).toHaveAttribute('data-stand', profile.key)
      expect(new URL(page.url()).hash).toBe(`#mock-${profile.key}`)
      const stand = page.locator(`#mock-${profile.key}`)
      const url = (await stand.locator('.mock-url pre code').textContent())!.trim()
      expect(url).toMatch(new RegExp(`^https?://[^/]+/mock/${profile.key}$`))
      const link = new URL((await stand.locator('.mock-acts a[href^="reclash:"]').getAttribute('href'))!)
      expect(link.host).toBe('install-config')
      expect(link.searchParams.get('url')).toBe(url)
      expect(link.searchParams.get('name')).toBe((await stand.locator('.mock-stand-label').textContent())!.trim())
    }
  })

  test(`a stand link opens that stand (${language})`, async ({ page }) => {
    await page.goto(`/${language}/mock-subs#mock-sentinel`)
    await expect(page.locator('#mock-sentinel')).toBeVisible()
    await expect(page.locator('.mock-stand')).toHaveCount(1)
  })

  test(`the inspector switches tabs and shows the hosted manifest (${language})`, async ({ page, request }) => {
    await page.goto(`/${language}/mock-subs`)
    await open(page, 'ember')
    const ember = page.locator('#mock-ember')
    const tab = (id: string) => ember.locator(`[role="tab"][data-tab="${id}"]`)
    const panel = ember.locator('[role="tabpanel"]:not([hidden])')
    await expect(tab('config')).toHaveAttribute('aria-selected', 'true')
    const hosted = await (await request.get(mockConfigPath('ember'))).text()
    await expect(panel.locator('pre code')).toHaveText(hosted.trimEnd())
    await tab('headers').click()
    await expect(tab('headers')).toHaveAttribute('aria-selected', 'true')
    await expect(panel.locator('.mock-hdr dt', { hasText: 'reclash-config' })).toHaveCount(1)
    await tab('headers').press('ArrowRight')
    await expect(tab('config')).toBeFocused()
    await tab('body').click()
    await expect(panel.locator('a[href="/mock/ember"]')).toHaveCount(1)
    await expect(ember.locator('[role="tabpanel"]:not([hidden])')).toHaveCount(1)
  })

  test(`a stand without a manifest explains it (${language})`, async ({ page }) => {
    await page.goto(`/${language}/mock-subs`)
    await open(page, 'nimbus')
    const nimbus = page.locator('#mock-nimbus')
    await expect(nimbus.locator('[data-tab="body"]')).toHaveAttribute('aria-selected', 'true')
    await expect(nimbus.locator('[data-tab="config"]')).toHaveClass(/is-empty/)
    await nimbus.locator('[data-tab="config"]').click()
    await expect(nimbus.locator('.mock-insp-none')).toBeVisible()
  })

  test(`the builder link opens the builder with the stand state (${language})`, async ({ page }) => {
    await page.goto(`/${language}/mock-subs`)
    await page.locator('#mock-halo .mock-builder-link').click()
    await page.waitForURL(new RegExp(`/${language}/builder/?#m=`))
    expect(new URL(page.url()).hash.startsWith('#m=')).toBe(true)
  })
}

test('every stand fits a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ru/mock-subs')
  for (const key of keys) {
    await open(page, key)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
