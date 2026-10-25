import { test, expect } from '@playwright/test'
import { headerReference } from '../../shared/provider/reference'

const sections = ['overview', 'rules', 'compat', 'delivery', 'hwid', 'checklist']
const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

for (const [language, title, contents] of [['ru', 'Документация по заголовкам', 'Содержание'], ['en', 'Header documentation', 'Contents']] as const) {
  test(`documentation renders in ${language} with contents and reference links`, async ({ page }) => {
    await page.goto(`/${language}/docs`)
    await expect(page.locator('h1')).toHaveText(title)
    await expect(page.locator('.doc-sec')).toHaveCount(sections.length)
    const toc = page.getByRole('navigation', { name: contents })
    const anchors = await toc.locator('.doc-toc-list a').evaluateAll(links => links.map(link => link.getAttribute('href')))
    expect(anchors).toEqual(sections.map(id => `#${id}`))
    for (const id of sections) await expect(page.locator(`section#${id} h2`)).toHaveCount(1)
    const references = await page.locator('a.doc-hlink').evaluateAll(links => links.map(link => link.getAttribute('href')))
    expect(references.length).toBeGreaterThan(10)
    for (const href of references) expect(href).toMatch(new RegExp(`^/${language}/reference#h-[a-z0-9-]+$`))
    expect(references).toContain(`/${language}/reference#h-reclash-view`)
    expect(references).toContain(`/${language}/reference#h-subscription-userinfo`)
    const ids = new Set(headerReference.map(entry => entry.id))
    for (const href of references) expect(ids.has(href!.split('#')[1]!), href!).toBe(true)
    await expect(page.locator('.doc-chain .is-win')).toHaveCount(5)
  })
}

test('contents filter, in-page navigation and scroll-spy', async ({ page }) => {
  await page.goto('/en/docs')
  const toc = page.locator('.doc-toc')
  await expect(toc.getByRole('searchbox')).toBeEnabled()
  await toc.getByRole('searchbox').fill('cdn')
  await expect(toc.locator('.doc-toc-list li:visible')).toHaveCount(1)
  await expect(toc.locator('.doc-toc-list li:visible a')).toHaveAttribute('href', '#delivery')
  await toc.getByRole('searchbox').fill('кэш')
  await expect(toc.locator('.doc-toc-list li:visible a')).toHaveAttribute('href', '#delivery')
  await toc.getByRole('searchbox').fill('no such section')
  await expect(toc.getByRole('status')).toBeVisible()
  await toc.getByRole('searchbox').fill('')
  await expect(toc.locator('.doc-toc-list li:visible')).toHaveCount(sections.length)
  await toc.locator('a[href="#hwid"]').click()
  await expect(page).toHaveURL(/\/en\/docs\/?#hwid$/)
  await expect(toc.locator('a[aria-current="location"]')).toHaveAttribute('href', '#hwid')
  await expect(page.locator('section#hwid h2')).toBeFocused()
  await page.locator('section#delivery').getByRole('link', { name: '“Parsing rules”' }).click()
  await expect(page).toHaveURL(/#rules$/)
  await expect(toc.locator('a[aria-current="location"]')).toHaveAttribute('href', '#rules')
})

test('legacy documentation alias keeps its fragment and the page has no horizontal scroll on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ru/docs.html#compat')
  await expect(page.locator('section#compat')).toBeVisible()
  expect(await page.evaluate(() => document.body.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  const hero = await page.locator('.ph h1').evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    return range.getBoundingClientRect().right
  })
  expect(hero).toBeLessThanOrEqual(390)
})
