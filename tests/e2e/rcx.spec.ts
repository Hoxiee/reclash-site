import { test, expect } from '@playwright/test'

const sections = ['overview', 'profiles', 'scenarios', 'evidence', 'sharing', 'source-docs']
const errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

for (const [language, title] of [['ru', 'Автоматическая маршрутизация RCX'], ['en', 'RCX automatic routing']] as const) {
  test(`RCX guide renders in ${language} with examples and contents`, async ({ page }) => {
    await page.goto(`/${language}/rcx`)
    await expect(page.locator('h1')).toHaveText(title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://reclash.pages.dev/${language}/rcx`)
    for (const alternate of ['ru', 'en']) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${alternate}"]`)).toHaveAttribute('href', `https://reclash.pages.dev/${alternate}/rcx`)
    }
    await expect(page.locator('.doc-sec')).toHaveCount(sections.length)
    for (const id of sections) await expect(page.locator(`section#${id} h2`)).toHaveCount(1)

    const contents = page.getByRole('navigation', { name: language === 'ru' ? 'Содержание' : 'Contents' })
    const anchors = await contents.locator('.doc-toc-list a').evaluateAll(links => links.map(link => link.getAttribute('href')))
    expect(anchors).toEqual(sections.map(id => `#${id}`))
    await expect(page.locator('#profiles .codeblock pre')).toContainText('rcx: 1')
    await expect(page.locator('#scenarios .codeblock pre')).toContainText('GEOSITE,telegram')
    await expect(page.locator('#sharing .codeblock pre').first()).toContainText('reclash://routing')

    await contents.locator('a[href="#scenarios"]').click()
    await expect(page).toHaveURL(new RegExp(`#scenarios$`))
    await expect(page.locator('#scenarios h2')).toBeFocused()
    await expect(contents.locator('a[aria-current="location"]')).toHaveAttribute('href', '#scenarios')
  })
}

test('RCX guide is linked from developer navigation on desktop and mobile', async ({ page }) => {
  await page.goto('/en')
  await page.locator('.dd > button').click()
  const desktopLink = page.locator('.dd-panel').getByRole('link', { name: /RCX auto routing/ })
  await expect(desktopLink).toBeVisible()
  await desktopLink.click()
  await expect(page).toHaveURL(/\/en\/rcx\/?$/)
  await expect(page.locator('h1')).toHaveText('RCX automatic routing')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ru')
  const burger = page.getByRole('button', { name: 'Меню', exact: true })
  await burger.click()
  const mobileLink = page.locator('.menu').getByRole('link', { name: 'Маршрутизация RCX', exact: true })
  await expect(mobileLink).toBeVisible()
  await mobileLink.click()
  await expect(page).toHaveURL(/\/ru\/rcx\/?$/)
  await expect(page.locator('h1')).toHaveText('Автоматическая маршрутизация RCX')
})
