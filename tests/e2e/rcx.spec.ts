import { test, expect } from '@playwright/test'
import { rcxLanguages, rcxPages, rcxPagePath } from '../../shared/site/rcx'

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

for (const [language, title] of [['ru', 'Автоматическая маршрутизация RCX'], ['en', 'RCX automatic routing'], ['zh-CN', 'RCX 自动路由']] as const) {
  test(`complete RCX handbook renders in ${language}`, async ({ page }) => {
    await page.goto(rcxPagePath(language))
    await expect(page.locator('h1')).toHaveText(title)
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://reclash.pages.dev/${language}/rcx`)
    for (const alternate of rcxLanguages) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${alternate}"]`)).toHaveAttribute('href', `https://reclash.pages.dev/${alternate}/rcx`)
    }
    await expect(page.locator('.rcx-sidebar .rcx-chapters a')).toHaveCount(rcxPages.length)
    await expect(page.locator('#quick-start-in-five-minutes')).toBeAttached()
    await expect(page.locator('.rcx-article > .codeblock pre').first()).toContainText('rcx: 1')
    await expect(page.locator('.rcx-diagram img')).toHaveCount(1)
    await page.locator('.rcx-diagram img').scrollIntoViewIfNeeded()
    await expect.poll(() => page.locator('.rcx-diagram img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)

    const profile = rcxPages.find(item => item.slug === 'profiles')!
    await page.locator('.rcx-sidebar').getByRole('link', { name: profile.titles[language], exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/${language}/rcx/profiles/?$`))
    await expect(page.locator('h1')).toHaveText(profile.titles[language])
    await expect(page.locator('.rcx-article')).toContainText('stranded')
    await expect(page.locator('.rcx-article table')).not.toHaveCount(0)
  })
}

test('every chapter is prerendered with its own canonical URL and source', async ({ request }) => {
  for (const language of rcxLanguages) {
    for (const chapter of rcxPages) {
      const path = rcxPagePath(language, chapter.slug)
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)
      const html = await response.text()
      expect(html, path).toContain(`rel="canonical" href="https://reclash.pages.dev${path}"`)
      expect(html, path).toContain(`docs/${language}/auto-routing/${chapter.file}`)
      expect(html, path).toMatch(/class="[^"]*\brcx-article\b[^"]*"/)
    }
  }
})

test('contents, anchors and language switches preserve the chapter and query', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/rcx/profiles?from=handbook')
  const contents = page.locator('.rcx-outline')
  await contents.locator('a[href="#pool"]').click()
  await expect(page).toHaveURL(/\/en\/rcx\/profiles\?from=handbook#pool$/)
  await expect(page.locator('.rcx-heading#pool')).toBeFocused()
  await expect(contents.locator('a[aria-current="location"]')).toHaveAttribute('href', '#pool')
  await expect(page.locator('.rcx-page .rcx-languages')).toHaveCount(0)
  await expect(page.locator('.rcx-page [hreflang]')).toHaveCount(0)
  await page.keyboard.press('Control+Home')
  await page.locator('.nav .lang a[lang="ru"]').click()
  await expect(page).toHaveURL(/\/ru\/rcx\/profiles\?from=handbook#pool$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  await expect(page.locator('h1')).toHaveText('Профили')
  await page.keyboard.press('Control+Home')
  await page.locator('.nav .lang a[lang="en"]').click()
  await expect(page).toHaveURL(/\/en\/rcx\/profiles\?from=handbook#pool$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('h1')).toHaveText('Profiles')
})

test('localized anchors remain usable with the site language switch', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/ru/rcx')
  const target = await page.locator('.rcx-heading[data-level="2"]').first().evaluate(element => ({
    id: element.id,
    alias: element.previousElementSibling?.id,
  }))
  expect(target.alias).toBeTruthy()
  await page.goto(`/ru/rcx?from=legacy#${encodeURIComponent(target.alias!)}`)
  await expect.poll(() => new URL(page.url()).hash).toBe(`#${target.id}`)
  await expect(page.locator('.nav .lang a[lang="en"]')).toHaveAttribute('href', `/en/rcx?from=legacy#${target.id}`)
  await page.keyboard.press('Control+Home')
  await page.locator('.nav .lang a[lang="en"]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect.poll(() => new URL(page.url()).hash).toBe(`#${target.id}`)
  expect(new URL(page.url()).search).toBe('?from=legacy')
  await expect(page.locator(`.rcx-heading[id="${target.id}"]`)).toBeInViewport()
})

test('search loads locally on demand and finds text from another chapter', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/en/rcx')
  const input = page.locator('#rcx-search-input')
  await input.fill('dwell')
  const results = page.locator('.rcx-search-results')
  await expect(results.locator('li').first()).toBeVisible()
  await expect(results).toContainText(/switch/i)
  await input.press('Tab')
  await expect(results.locator('a').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(results).toHaveCount(0)
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await input.fill('dwell')
  await results.locator('a').first().click()
  await expect(page).toHaveURL(/\/en\/rcx\/.+#/)
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true)
})

test('editor placeholders have stable names, reserved dimensions and capture instructions', async ({ page }) => {
  await page.goto('/ru/rcx/editor/routes')
  const slots = page.locator('[data-screenshot]')
  await expect(slots).toHaveCount(11)
  const slot = page.locator('[data-screenshot="route-editor-ladder"]')
  if (await slot.locator('img').count()) {
    await expect(slot.locator('img')).toHaveAttribute('src', /\/assets\/rcx\/screenshots\/ru\/route-editor-ladder\./)
  } else {
    await expect(slot.getByRole('img')).toHaveAttribute('aria-label', /route-editor-ladder/)
  }
  const frame = await slot.locator('.rcx-screenshot-frame').boundingBox()
  expect(frame!.height / frame!.width).toBeCloseTo(915 / 412, 1)
  await slot.locator('summary').click()
  await expect(slot.locator('details')).toContainText('/assets/rcx/screenshots/ru/route-editor-ladder.png')
  await slot.locator('details a').click()
  await expect(page).toHaveURL(/\/ru\/rcx\/screenshots#demo-setup$/)
  await expect(page.locator('.rcx-article tbody tr')).toHaveCount(57)
})

test('legacy RCX anchors and nested HTML aliases resolve without losing state', async ({ page }) => {
  await page.goto('/en/rcx.html?from=legacy#profiles')
  await expect(page).toHaveURL(/\/en\/rcx\/profiles\?from=legacy$/)
  await expect(page.locator('h1')).toHaveText('Profiles')
  await page.goto('/zh-CN/rcx/editor/studio.html?from=legacy#history-and-restore')
  await expect(page.locator('#history-and-restore')).toBeAttached()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://reclash.pages.dev/zh-CN/rcx/editor/studio')
  await expect(page).toHaveURL(/from=legacy#history-and-restore$/)
})

test('mobile handbook keeps tables and diagrams inside scrollable regions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/zh-CN/rcx/engine')
  const menu = page.locator('.rcx-mobile-navigation details').first()
  await menu.locator('summary').click()
  await expect(menu.locator('.rcx-chapters a')).toHaveCount(rcxPages.length)
  const destination = menu.locator('a[href="/zh-CN/rcx/editor/hub"]')
  await destination.click()
  await expect(page).toHaveURL(/\/zh-CN\/rcx\/editor\/hub\/?$/)
  await expect(page.locator('[data-screenshot]')).toHaveCount(21)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  await page.goto('/en/rcx/engine')
  const diagram = page.locator('.rcx-diagram-scroll').first()
  await diagram.scrollIntoViewIfNeeded()
  await expect.poll(() => diagram.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  const dimensions = await diagram.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }))
  expect(dimensions.scroll).toBeGreaterThan(dimensions.width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
})

test('code examples copy their exact YAML and unknown chapters return 404', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/zh-CN/rcx/profiles')
  const example = page.locator('.codeblock').first()
  const source = await example.locator('pre').innerText()
  await example.getByRole('button', { name: '复制', exact: true }).click()
  await expect(example.getByRole('button', { name: '已复制', exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source)
  expect((await request.get('/en/rcx/no-such-chapter')).status()).toBe(404)
  expect((await request.get('/zh-CN/download')).status()).toBe(404)
})

test('nested chapters remount content and reuse the site entrance animations', async ({ page }) => {
  await page.goto('/en/rcx/profiles')
  for (const slug of ['conditions', 'scenarios']) {
    const chapter = rcxPages.find(item => item.slug === slug)!
    await page.locator(`.rcx-sidebar a[href="/en/rcx/${slug}"]`).click()
    await expect(page).toHaveURL(new RegExp(`/en/rcx/${slug}$`))
    await expect(page.locator('h1')).toHaveText(chapter.titles.en)
    await expect(page.locator('h1')).toHaveClass(/is-in/)
    const heading = page.locator('.rcx-heading[data-fade]').first()
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toHaveClass(/is-in/)
    await expect(heading).toHaveCSS('opacity', '1')
  }
  await page.goBack()
  await expect(page.locator('h1')).toHaveText('Conditions')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.rcx-page [data-fade]:not(.is-in)')).toHaveCount(0)
})

test('the site language switch loads English from a Chinese chapter', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/zh-CN/rcx/profiles?from=translation#pool')
  await expect(page.locator('h1')).toHaveClass(/is-in/)
  await page.keyboard.press('Control+Home')
  await page.locator('.nav .lang a[lang="en"]').click()
  await expect(page).toHaveURL(/\/en\/rcx\/profiles\/?\?from=translation#pool$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('h1')).toHaveText('Profiles')
})

test('mobile contents works with the keyboard and closes before focusing its heading', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/rcx/profiles')
  const menus = page.locator('.rcx-mobile-navigation details')
  const chapters = menus.first()
  const contents = menus.nth(1)
  await chapters.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(chapters).toHaveAttribute('open', '')
  await contents.locator('summary').focus()
  await page.keyboard.press('Space')
  await expect(contents).toHaveAttribute('open', '')
  await expect(chapters).not.toHaveAttribute('open')
  await contents.locator('a[href="#pool"]').click()
  await expect(page).toHaveURL(/\/en\/rcx\/profiles#pool$/)
  await expect(contents).not.toHaveAttribute('open')
  const heading = page.locator('.rcx-heading#pool')
  await expect(heading).toBeFocused()
  await expect.poll(async () => {
    const target = await heading.boundingBox()
    const navigation = await page.locator('.rcx-mobile-navigation').boundingBox()
    return target!.y >= navigation!.y + navigation!.height
  }).toBe(true)
})

for (const width of [390, 768]) {
  test(`RCX reading layout fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ru/rcx/editor/routes')
    await expect(page.locator('h1')).toHaveClass(/is-in/)
    const dimensions = await page.locator('h1').evaluate(element => ({
      heading: element.scrollWidth - element.clientWidth,
      page: document.documentElement.scrollWidth - innerWidth,
    }))
    expect(dimensions.heading).toBeLessThanOrEqual(0)
    expect(dimensions.page).toBeLessThanOrEqual(0)
    const table = page.locator('.rcx-table-scroll').first()
    await table.scrollIntoViewIfNeeded()
    await expect(table).toBeVisible()
    expect(await table.evaluate(element => element.getBoundingClientRect().right)).toBeLessThanOrEqual(width)
  })
}

test('RCX handbook remains in desktop and mobile site navigation', async ({ page }) => {
  await page.goto('/en')
  await page.locator('.dd > button').click()
  await page.locator('.dd-panel').getByRole('link', { name: /RCX auto routing/ }).click()
  await expect(page.locator('h1')).toHaveText('RCX automatic routing')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ru')
  await page.getByRole('button', { name: 'Меню', exact: true }).click()
  await page.locator('.menu').getByRole('link', { name: 'Маршрутизация RCX', exact: true }).click()
  await expect(page.locator('h1')).toHaveText('Автоматическая маршрутизация RCX')
})
