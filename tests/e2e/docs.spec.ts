import { test, expect } from '@playwright/test'
import { docLanguages, docPage, docPages, docPath, docSections, docSourceUrl } from '../../shared/docs/catalogue'
import { headerReference } from '../../shared/provider/reference'

const origin = 'https://reclash.pages.dev'
const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

for (const language of ['ru', 'en'] as const) {
  test(`documentation home maps every section in ${language}`, async ({ page }) => {
    await page.goto(docPath(language))
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.locator('h1')).toHaveText(docPage('')!.titles[language]!)
    await expect(page).toHaveTitle(new RegExp(language === 'ru' ? 'Документация' : 'Documentation'))
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}${docPath(language)}`)
    for (const alternate of docLanguages) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${alternate}"]`)).toHaveAttribute('href', `${origin}${docPath(alternate)}`)
    }
    await expect(page.locator('.hb-map-card')).toHaveCount(docSections.length)
    await expect(page.locator('.hb-side .hb-nav-section:not(.hb-nav-tools) li a')).toHaveCount(docPages.length - 1)
  })
}

test('every page is prerendered and articles link to their pinned source', async ({ request }) => {
  for (const language of docLanguages) {
    for (const entry of docPages) {
      const path = docPath(language, entry.slug)
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)
      const html = await response.text()
      expect(html, path).toContain(`rel="canonical" href="${origin}${path}"`)
      if (entry.slug) expect(html, path).toContain(`href="${docSourceUrl(language, entry.file)}"`)
      expect(html, path).toContain('class="hb-article"')
      expect((await request.get(`${path}.html`)).status(), `${path}.html`).toBe(200)
    }
  }
  expect((await request.get('/en/docs/no-such-page')).status()).toBe(404)
})

test('sidebar, pager and outline navigate between and within pages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const profiles = docPage('rcx/profiles')!
  await page.goto(docPath('en', 'rcx'))
  await page.locator('.hb-side').getByRole('link', { name: profiles.titles.en, exact: true }).click()
  await expect(page).toHaveURL(/\/en\/docs\/rcx\/profiles\/?$/)
  await expect(page.locator('h1')).toHaveText(profiles.titles.en!)
  await expect(page.locator('.hb-side a[aria-current="page"]')).toHaveText(profiles.titles.en!)
  const outline = page.locator('.hb-toc .hb-outline a')
  const target = await outline.nth(1).getAttribute('href')
  await outline.nth(1).click()
  await expect(page).toHaveURL(new RegExp(`${target}$`))
  await expect(page.locator(target!)).toBeInViewport()
  await expect(page.locator(`.hb-toc a[href="${target}"]`)).toHaveAttribute('aria-current', 'location')
  const next = docPages[docPages.indexOf(profiles) + 1]!
  await page.locator('.hb-pager-link.is-next').click()
  await expect(page.locator('h1')).toHaveText(next.titles.en!)
})

test('docs navigation preserves its shell while replacing the reader', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const profiles = docPage('rcx/profiles')!
  const rcx = docPage('rcx')!
  await page.goto(docPath('en', 'rcx'))
  await expect(page.locator('html')).toHaveClass(/is-loaded/)
  await page.evaluate(() => {
    const html = document.documentElement
    const native = document.startViewTransition?.bind(document)
    html.dataset.docsViewTransitionCalls = '0'
    if (native) document.startViewTransition = ((callback: () => void | Promise<void>) => {
      html.dataset.docsViewTransitionCalls = String(Number(html.dataset.docsViewTransitionCalls) + 1)
      return native(callback)
    }) as typeof document.startViewTransition
  })
  const shell = (await page.locator('.hb').elementHandle())!
  const sidebar = (await page.locator('.hb-side').elementHandle())!
  const nav = (await page.locator('.hb-nav').elementHandle())!
  const siteNav = (await page.locator('.nav').elementHandle())!
  const oldArticle = (await page.locator('.hb-article').elementHandle())!
  const oldToc = (await page.locator('.hb-toc').elementHandle())!
  const tools = page.locator('.hb-nav-tools')
  await tools.getByRole('button').click()
  await expect(tools.getByRole('button')).toHaveAttribute('aria-expanded', 'true')

  const expectSameShell = async () => {
    expect(await page.locator('.hb').evaluate((element, original) => element === original, shell)).toBe(true)
    expect(await page.locator('.hb-side').evaluate((element, original) => element === original, sidebar)).toBe(true)
    expect(await page.locator('.hb-nav').evaluate((element, original) => element === original, nav)).toBe(true)
    expect(await page.locator('.nav').evaluate((element, original) => element === original, siteNav)).toBe(true)
    await expect(tools.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    expect(await page.locator('html').getAttribute('data-docs-view-transition-calls')).toBe('0')
  }
  const expectArticleReplaced = async (article: NonNullable<typeof oldArticle>, toc: NonNullable<typeof oldToc>) => {
    expect(await page.locator('.hb-article').evaluate((element, original) => element !== original, article)).toBe(true)
    expect(await page.locator('.hb-toc').evaluate((element, original) => element !== original, toc)).toBe(true)
  }

  await page.locator('.hb-side').getByRole('link', { name: profiles.titles.en, exact: true }).click()
  await expect(page).toHaveURL(/\/en\/docs\/rcx\/profiles\/?$/)
  await expect(page.locator('h1')).toHaveText(profiles.titles.en!)
  await expect(page.locator('.hb-side a[aria-current="page"]')).toHaveText(profiles.titles.en!)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}${docPath('en', 'rcx/profiles')}`)
  await expectArticleReplaced(oldArticle, oldToc)
  await expectSameShell()
  const profilesArticle = (await page.locator('.hb-article').elementHandle())!
  const profilesToc = (await page.locator('.hb-toc').elementHandle())!
  const next = docPages[docPages.indexOf(profiles) + 1]!
  await page.locator('.hb-pager-link.is-next').click()
  await expect(page.locator('h1')).toHaveText(next.titles.en!)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}${docPath('en', next.slug)}`)
  await expectArticleReplaced(profilesArticle, profilesToc)
  await expectSameShell()
  await page.goBack()
  await expect(page.locator('h1')).toHaveText(profiles.titles.en!)
  await expectSameShell()
  await page.goForward()
  await expect(page.locator('h1')).toHaveText(next.titles.en!)
  await expectSameShell()
  await page.goBack()
  await expect(page.locator('h1')).toHaveText(profiles.titles.en!)
  await expectSameShell()
  await page.goBack()
  await expect(page.locator('h1')).toHaveText(rcx.titles.en!)
  await expectSameShell()
  await page.goForward()
  await expect(page.locator('h1')).toHaveText(profiles.titles.en!)
  await expectSameShell()
  await page.locator('.hb-side a[href="/en/reference"]').click()
  await expect(page).toHaveURL(/\/en\/reference\/?$/)
  await expect(page.locator('html')).toHaveAttribute('data-docs-view-transition-calls', '1')
})

test('the command palette searches every section locally and opens the match', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto(docPath('en', 'providers'))
  await expect(page.locator('html')).toHaveClass(/is-loaded/)
  await page.keyboard.press('/')
  const palette = page.locator('.hb-palette')
  await expect(palette).toBeVisible()
  const input = palette.getByRole('combobox')
  await expect(input).toBeFocused()
  await input.fill('dwell')
  await expect(palette.locator('[role="option"]').first()).toBeVisible()
  await expect(palette.locator('mark').first()).toHaveText(/dwell/i)
  await input.fill('no such phrase 12345')
  await expect(palette.getByRole('status')).toHaveText('No results')
  await input.fill('subscription-userinfo')
  await input.press('Enter')
  await expect(palette).toBeHidden()
  await expect(page).toHaveURL(/\/en\/docs\/providers\//)
  await page.keyboard.press('Control+k')
  await expect(palette).toBeVisible()
  await expect(input).toHaveValue('subscription-userinfo')
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true)
})

for (const language of docLanguages) {
  test(`header names in ${language} link to the provider reference`, async ({ page }) => {
    await page.goto(docPath(language, 'providers/headers'))
    const references = await page.locator('.hb-prose a.hb-ref').evaluateAll(links => links.map(link => link.getAttribute('href')!))
    expect(references.length).toBeGreaterThan(10)
    const ids = new Set(headerReference.map(entry => entry.id))
    for (const href of references) {
      expect(href).toMatch(new RegExp(`^/${language}/reference#h-[a-z0-9-]+$`))
      expect(ids.has(href.split('#')[1]!), href).toBe(true)
    }
  })
}

test('the policy schema link serves the published JSON Schema', async ({ page, request }) => {
  await page.goto(docPath('en', 'providers/policy'))
  await expect(page.locator('.hb-prose a[href="/schemas/provider-policy.schema.json"]').first()).toBeVisible()
  const schema = await request.get('/schemas/provider-policy.schema.json')
  expect(schema.status()).toBe(200)
  expect((await schema.json()).properties.version.const).toBe(1)
})

test('retired RCX paths, guide fragments and localized anchors reach the new pages', async ({ page, request }) => {
  for (const [from, to] of [['/en/rcx', '/en/docs/rcx'], ['/ru/rcx/profiles', '/ru/docs/rcx/profiles'], ['/en/rcx/editor/studio.html', '/en/docs/rcx/editor/studio'], ['/zh-CN/rcx/engine', '/en/docs/rcx/engine'], ['/zh-CN/docs/rcx', '/en/docs/rcx']]) {
    const response = await request.get(from, { maxRedirects: 0 })
    expect(response.status(), from).toBe(301)
    expect(new URL(response.headers().location!, origin).pathname, from).toBe(to)
  }
  await page.goto('/en/docs?from=legacy#policy')
  await expect(page).toHaveURL(/\/en\/docs\/providers\/policy\/?\?from=legacy$/)
  await page.goto('/en/docs/rcx#profiles')
  await expect(page).toHaveURL(/\/en\/docs\/rcx\/profiles\/?$/)
  await page.goto(docPath('ru', 'rcx/profiles'))
  const heading = await page.locator('.hb-prose .hb-h[data-level="2"]').first().evaluate(element => ({ id: element.id, alias: element.previousElementSibling?.id }))
  expect(heading.alias).toBeTruthy()
  await page.goto(`${docPath('ru', 'rcx/profiles')}?from=legacy#${encodeURIComponent(heading.alias!)}`)
  await expect.poll(() => new URL(page.url()).hash).toBe(`#${heading.id}`)
  expect(new URL(page.url()).search).toBe('?from=legacy')
})

test('the site language switch keeps the page, query and section', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${docPath('en', 'rcx/profiles')}?from=switch`)
  const id = await page.locator('.hb-prose .hb-h[data-level="2"]').first().getAttribute('id')
  await page.goto(`${docPath('en', 'rcx/profiles')}?from=switch#${id}`)
  await page.keyboard.press('Control+Home')
  await page.locator('.nav .lang a[lang="ru"]').click()
  await expect(page).toHaveURL(new RegExp(`/ru/docs/rcx/profiles/?\\?from=switch#${id}$`))
  await expect(page.locator('h1')).toHaveText(docPage('rcx/profiles')!.titles.ru!)
})

test('code samples copy their exact text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(docPath('en', 'rcx/profiles'))
  const example = page.locator('.hb-prose .codeblock').first()
  const source = await example.locator('pre').innerText()
  await example.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(example.getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source)
})

test('screenshot slots reserve their size and link to the capture spec', async ({ page }) => {
  await page.goto(docPath('en', 'rcx/editor/routes'))
  const slot = page.locator('[data-screenshot]').first()
  await expect(slot).toBeVisible()
  const frame = await slot.locator('.hb-shot-frame').boundingBox()
  const ratio = await slot.locator('.hb-shot-frame').evaluate(element => getComputedStyle(element).aspectRatio)
  const [width, height] = ratio.split('/').map(Number)
  expect(frame!.height / frame!.width).toBeCloseTo(height! / width!, 1)
  await slot.locator('.hb-shot-spec').click()
  await expect(page).toHaveURL(/\/en\/docs\/rcx\/screenshots\/?$/)
  await expect(page.locator('.hb-table tbody tr').first()).toBeVisible()
})

for (const width of [390, 768]) {
  test(`phone and tablet layout at ${width}px uses the drawer and fits the viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(docPath('ru', 'providers/headers'))
    await expect(page.locator('.hb-toc')).toBeHidden()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
    const table = page.locator('.hb-table').first()
    await table.scrollIntoViewIfNeeded()
    expect(await table.evaluate(element => element.getBoundingClientRect().right)).toBeLessThanOrEqual(width)
    await page.keyboard.press('Control+Home')
    await page.locator('.hb-bar-menu').click()
    const drawer = page.locator('.hb-side')
    await expect(drawer).toBeInViewport()
    const policy = docPage('providers/policy')!
    await drawer.getByRole('link', { name: policy.titles.ru, exact: true }).click()
    await expect(page).toHaveURL(/\/ru\/docs\/providers\/policy\/?$/)
    await expect(drawer).not.toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  })
}

test('documentation is a top-level link in desktop and mobile navigation', async ({ page }) => {
  await page.goto('/en')
  await page.locator('.nav-links').getByRole('link', { name: 'Docs', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/docs\/?$/)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ru')
  await page.getByRole('button', { name: 'Меню', exact: true }).click()
  await page.locator('.menu').getByRole('link', { name: 'Документация', exact: true }).click()
  await expect(page).toHaveURL(/\/ru\/docs\/?$/)
})
