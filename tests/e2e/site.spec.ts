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
        expect(body).toMatch(new RegExp(`<html\\b[^>]*\\blang="${language}"`))
        expect(body).toMatch(/<h1[ >]/)
        expect(body).toContain(`href="https://reclash.pages.dev${pagePath(language, page.key)}"`)
      }
    }
  }
})

test('language navigation preserves legacy query and fragment state', async ({ page }) => {
  await page.goto('/ru/builder.html?mode=example#cfg=sample')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Соберите заголовки и сразу посмотрите, что увидит пользователь.')
  await page.getByRole('link', { name: 'Переключить на английский' }).click()
  await expect(page).toHaveURL(/\/en\/builder(?:\.html|\/)?\?mode=example#cfg=sample$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build headers and see what your users will see.')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('the root picks a language without a chooser and remembers explicit switches', async ({ browser, baseURL }) => {
  for (const [locale, target] of [['ru-RU', '/ru'], ['be-BY', '/ru'], ['en-US', '/en'], ['de-DE', '/en']] as const) {
    const context = await browser.newContext({ locale, baseURL })
    const page = await context.newPage()
    await page.goto('/?utm=1#top')
    await expect(page).toHaveURL(new RegExp(`${target}(?:/)?\\?utm=1#top$`))
    await context.close()
  }
  const context = await browser.newContext({ locale: 'ru-RU', baseURL })
  const page = await context.newPage()
  await page.goto('/ru/start')
  await page.locator('.lang').getByRole('link', { name: 'Переключить на английский' }).click()
  await expect(page).toHaveURL(/\/en\/start/)
  await page.goto('/')
  await expect(page).toHaveURL(/\/en\/?$/)
  await context.close()
})

test('the loader covers the first paint, opens and leaves the page interactive', async ({ page }) => {
  await page.goto('/en/start')
  await expect(page.locator('html')).toHaveClass(/\bjs\b/)
  await expect(page.locator('html')).toHaveClass(/is-loaded/)
  await expect(page.locator('.loader')).toBeHidden()
  await expect(page.locator('h1 [data-words], h1[data-words]').first()).toHaveClass(/is-in/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/intro-short/)
  await expect(page.locator('.loader')).toBeHidden()
})

test('home, keyboard navigation and mobile layout work', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('#hero-title')).toContainText('Freedom')
  await page.locator('.nav-links').getByRole('link', { name: 'Start and FAQ', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('From zero to traffic.')
  await page.goto('/ru')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['/ru', '/en', '/ru/start', '/en/start', '/ru/builder', '/en/builder', '/ru/gallery', '/en/gallery', '/en/reference', '/ru/mock-subs']) {
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
  await page.goto('/en/reference')
  await page.getByRole('link', { name: 'Report', exact: true }).hover()
  await expect.poll(() => reports.length).toBe(0)
  await page.evaluate(() => { (window as Window & { documentMarker?: string }).documentMarker = 'home' })
  await page.getByRole('link', { name: 'Report', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Report')
  expect(await page.evaluate(() => (window as Window & { documentMarker?: string }).documentMarker)).toBeUndefined()
  await page.evaluate(() => { (window as Window & { documentMarker?: string }).documentMarker = 'report' })
  await page.locator('.logo').first().click()
  await expect(page.locator('#hero-title')).toContainText('Freedom')
  expect(await page.evaluate(() => (window as Window & { documentMarker?: string }).documentMarker)).toBeUndefined()
})

test('unknown routes return a real prerendered 404', async ({ request }) => {
  for (const route of ['/missing', '/fr', '/ru/missing', '/ru/missing.html']) {
    const response = await request.get(route)
    expect(response.status()).toBe(404)
    expect(await response.text()).toContain('Страница недоступна')
  }
})


test('public copy and provider tools match the current application', async ({ request }) => {
  for (const language of languages) {
    const home = await (await request.get(`/${language}`)).text()
    expect(home).toContain('RCX')
    expect(home).not.toContain('Built-in DPI bypass')
    expect(home).not.toContain('Встроенный обход DPI')
    const reference = await (await request.get(`/${language}/reference`)).text()
    expect(reference).toContain('h-reclash-routing')
    expect(reference).toContain('app.color')
    expect(reference).not.toContain('id="h-reclash-hex"')
    expect(reference).not.toContain('id="h-flclashx-hex"')
  }
})
