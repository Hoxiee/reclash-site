import { test, expect } from '@playwright/test'
import { languages, legacyPath, pagePath, sitePages } from '../../shared/site/routes'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (/hydration/i.test(message.text())) errors.push(message.text())
  })
})
test.afterEach(() => { expect(errors).toEqual([]) })

test('all canonical and legacy pages serve prerendered bilingual HTML', async ({ request }) => {
  for (const language of languages) {
    for (const page of sitePages) {
      for (const route of [pagePath(language, page.key), legacyPath(language, page.key)]) {
        const response = await request.get(route)
        expect(response.status(), route).toBe(200)
        const body = await response.text()
        expect(body).toMatch(new RegExp(`<html\\s+lang="${language}"`))
        expect(body).toMatch(/<h1[ >]/)
        expect(body).toContain(`href="https://reclash.pages.dev${pagePath(language, page.key)}"`)
      }
    }
  }
})

test('language navigation preserves legacy query and fragment state', async ({ page }) => {
  await page.goto('/ru/builder.html?mode=example#cfg=sample')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Конструктор')
  await page.getByRole('link', { name: 'Переключить на английский' }).click()
  await expect(page).toHaveURL(/\/en\/builder(?:\.html|\/)?\?mode=example#cfg=sample$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Builder')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('home, keyboard navigation and mobile layout work', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'English' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ReClash')
  await page.getByRole('link', { name: 'Get started', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quick start')
  await page.goto('/ru')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['/ru', '/en/reference', '/ru/mock-subs']) {
    await page.goto(route)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('report policies apply to canonical, trailing-slash and legacy responses', async ({ request }) => {
  for (const language of languages) {
    for (const route of [pagePath(language, 'report'), `${pagePath(language, 'report')}/`, legacyPath(language, 'report')]) {
      const response = await request.get(route)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-security-policy']).toContain("connect-src 'none'")
      expect(response.headers()['referrer-policy']).toBe('no-referrer')
      expect(response.headers()['cache-control']).toBe('no-store')
      expect(response.headers()['x-robots-tag']).toContain('noindex')
    }
  }
})

test('report entry and exit navigate documents without prefetching', async ({ page }) => {
  const reports: string[] = []
  page.on('request', request => {
    if (/\/report(?:[/?#.]|$)/.test(request.url())) reports.push(request.url())
  })
  await page.goto('/en')
  await page.getByRole('link', { name: 'Report', exact: true }).hover()
  await expect.poll(() => reports.length).toBe(0)
  await page.evaluate(() => { (window as Window & { documentMarker?: string }).documentMarker = 'home' })
  await page.getByRole('link', { name: 'Report', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Report')
  expect(await page.evaluate(() => (window as Window & { documentMarker?: string }).documentMarker)).toBeUndefined()
  await page.evaluate(() => { (window as Window & { documentMarker?: string }).documentMarker = 'report' })
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ReClash')
  expect(await page.evaluate(() => (window as Window & { documentMarker?: string }).documentMarker)).toBeUndefined()
})

test('unknown routes return a real prerendered 404', async ({ request }) => {
  for (const route of ['/missing', '/fr', '/ru/missing', '/ru/missing.html']) {
    const response = await request.get(route)
    expect(response.status()).toBe(404)
    expect(await response.text()).toContain('Страница недоступна')
  }
})
