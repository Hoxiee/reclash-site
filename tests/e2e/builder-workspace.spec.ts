import { Buffer } from 'node:buffer'
import { test, expect, type Page } from '@playwright/test'

const errors: string[] = []
const external: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  external.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort() }
    return route.continue()
  })
  await page.route('**/runtime/preview/', route => route.fulfill({ status: 404, body: '' }))
})
test.afterEach(() => { expect(errors).toEqual([]); expect(external).toEqual([]) })

async function open(page: Page, language = 'en') {
  await page.goto(`/${language}/builder`)
  await expect(page.locator('#bf-provider-name')).toBeEditable({ timeout: 15_000 })
}
const output = (page: Page) => page.locator('.bout pre').first()
async function starter(page: Page, name: string) {
  const button = page.getByRole('group', { name: 'Manifest templates' }).getByRole('button', { name })
  if (!await button.isVisible()) await page.locator('.bstarter-pick summary').click()
  await button.click()
}
const undo = (page: Page) => page.getByRole('button', { name: 'Undo change', exact: true }).click()

test('templates keep existing values and produce YAML accepted by the real app parser', async ({ page }) => {
  await open(page)
  await page.locator('#bf-provider-name').fill('My own VPN')
  await starter(page, 'Service and support')
  await expect(page.locator('#bf-provider-name')).toHaveValue('My own VPN')
  for (const name of ['Dashboard appearance', 'Renewal and reminders', 'Cards and actions']) await starter(page, name)
  await expect(output(page)).toContainText('name: My own VPN')
  await expect(output(page)).toContainText('type: actions')
  await expect(page.locator('[data-test=verdict]')).toContainText('Accepted without warnings')
  await expect(page.locator('.bproblems')).toHaveCount(0)
  await expect(page.locator('.bdraft-state')).toHaveText('Saved to the link')
})

test('bilingual field search opens the section and supports arrow-key selection', async ({ page }) => {
  await open(page)
  await page.keyboard.press('/')
  const search = page.locator('#bfind-input')
  await expect(search).toBeFocused()
  await search.fill('Непрозрачность')
  await expect(page.locator('.bfind-results')).toContainText('wallpaper.opacity')
  await search.press('ArrowDown')
  await expect(page.locator('.bfind-results button').first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#bf-wallpaper-opacity')).toBeFocused()
  await expect(page.locator('#b-wallpaper .bsec-toggle')).toHaveAttribute('aria-expanded', 'true')
  await expect(search).toHaveValue('')
})

test('search opens the right card rather than the first card or the action selector', async ({ page }) => {
  await open(page)
  await starter(page, 'Cards and actions')
  await page.locator('#bfind-input').fill('cards.items.url')
  const result = page.locator('.bfind-results button').filter({ has: page.locator('code', { hasText: /^cards\.2\.items\.1\.url$/ }) })
  await result.click()
  await expect(page.locator('#bf-cards-2-items-1-url')).toBeFocused()
  await expect(page.locator('li[data-path="cards.2"] .bcard-toggle')).toHaveAttribute('aria-expanded', 'true')
})

test('undo and redo restore complete edits including reset without reviving an older link', async ({ page }) => {
  await open(page)
  await page.locator('#bf-provider-name').fill('Kept VPN')
  await starter(page, 'Dashboard appearance')
  await undo(page)
  await expect(output(page)).not.toContainText('power-button:')
  await expect(page.locator('#bf-provider-name')).toHaveValue('Kept VPN')
  await page.getByRole('button', { name: 'Redo change', exact: true }).click()
  await expect(output(page)).toContainText('power-button:')
  const reset = page.locator('.btop-actions .bdanger')
  await reset.click()
  await reset.click()
  await expect(page.locator('#bf-provider-name')).toHaveValue('')
  await undo(page)
  await expect(page.locator('#bf-provider-name')).toHaveValue('Kept VPN')
  await expect(output(page)).toContainText('power-button:')
  await expect(page).toHaveURL(/#m=/)
  await page.reload()
  await expect(page.locator('#bf-provider-name')).toHaveValue('Kept VPN', { timeout: 15_000 })
  await expect(output(page)).toContainText('power-button:')
})

test('clearing a field or a section is reversible and keyboard undo leaves text inputs alone', async ({ page }) => {
  await open(page)
  await page.locator('#bf-provider-name').fill('Keep this name')
  await page.getByRole('button', { name: 'Clear provider.name', exact: true }).click()
  await expect(page.locator('#bf-provider-name')).toHaveValue('')
  await undo(page)
  await expect(page.locator('#bf-provider-name')).toHaveValue('Keep this name')
  await starter(page, 'Dashboard appearance')
  await page.getByRole('button', { name: 'Clear section: View', exact: true }).click()
  await expect(output(page)).not.toContainText('view:')
  await page.keyboard.press('Control+z')
  await expect(output(page)).toContainText('view:')
  await page.locator('#bfind-input').fill('logo')
  await page.locator('#bfind-input').press('Control+z')
  await expect(output(page)).toContainText('view:')
})

test('an explicit empty list differs from an unset list and can be restored after reload', async ({ page }) => {
  await open(page)
  await page.locator('#b-reminders .bsec-toggle').click()
  const field = page.locator('[data-path="reminders.expire-days"]').first()
  await field.getByRole('button', { name: 'Empty list' }).click()
  await expect(output(page)).toContainText('expire-days: []')
  await expect(page.locator('[data-test=verdict]')).toContainText('Accepted without warnings')
  await expect(page.locator('.bdraft-state')).toHaveText('Saved to the link')
  await page.reload()
  await expect(page.locator('#b-reminders .bsec-toggle')).toHaveAttribute('aria-expanded', 'true', { timeout: 15_000 })
  await expect(field.getByRole('button', { name: 'Empty list' })).toHaveAttribute('aria-pressed', 'true')
  await field.getByRole('button', { name: 'Do not override' }).click()
  await expect(output(page)).not.toContainText('expire-days:')
  await undo(page)
  await expect(output(page)).toContainText('expire-days: []')
})

test('new cards start valid and duplication keeps content with a new unique id', async ({ page }) => {
  await open(page)
  await page.locator('#b-cards .bsec-toggle').click()
  await page.locator('#b-cards .badd').getByRole('button', { name: '+ Banner' }).click()
  await page.locator('#bf-cards-0-title').fill('My offer')
  await expect(page.locator('[data-test=verdict]')).toContainText('Accepted without warnings')
  await page.getByRole('button', { name: 'Duplicate card', exact: true }).click()
  await expect(page.locator('#bf-cards-1-id')).toHaveValue('banner-2')
  await expect(page.locator('#bf-cards-1-title')).toHaveValue('My offer')
  await expect(page.locator('#bf-cards-1-id')).toBeFocused()
  await undo(page)
  await expect(page.locator('#bf-cards-1-id')).toHaveCount(0)
  await expect(page.locator('#bf-cards-0-title')).toHaveValue('My offer')
})

test('the problem list opens a collapsed section and focuses the invalid field', async ({ page }) => {
  await open(page)
  await page.locator('#b-wallpaper .bsec-toggle').click()
  await page.locator('#bf-wallpaper-opacity').fill('0')
  await page.getByRole('button', { name: 'Collapse all', exact: true }).click()
  await page.locator('.bproblems button').filter({ has: page.locator('code', { hasText: /^wallpaper\.opacity$/ }) }).click()
  await expect(page.locator('#bf-wallpaper-opacity')).toBeFocused()
  await expect(page.locator('#b-wallpaper .bsec-toggle')).toHaveAttribute('aria-expanded', 'true')
})

test('unsupported versions and oversized files leave the current form intact', async ({ page }) => {
  await open(page)
  await page.locator('#bf-provider-name').fill('Keep the draft')
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.locator('#bimport-text').fill('version: 2\nprovider:\n  name: Wrong\n')
  await page.getByRole('button', { name: 'Load into the form' }).click()
  await expect(page.locator('.bimport .bf-err')).toContainText('This file version is not supported')
  await expect(page.locator('#bf-provider-name')).toHaveValue('Keep the draft')
  await page.evaluate(() => {
    const native = File.prototype.text
    ;(window as unknown as { fileTextReads: number }).fileTextReads = 0
    File.prototype.text = function () { (window as unknown as { fileTextReads: number }).fileTextReads++; return native.call(this) }
  })
  await page.locator('.bimport input[type=file]').setInputFiles({ name: 'large.yaml', mimeType: 'application/yaml', buffer: Buffer.alloc(512 * 1024 + 1, 'x') })
  await expect(page.locator('.bimport .bf-err')).toContainText('over 512 KiB')
  expect(await page.evaluate(() => (window as unknown as { fileTextReads: number }).fileTextReads)).toBe(0)
  await expect(page.locator('#bf-provider-name')).toHaveValue('Keep the draft')
})

for (const language of ['ru', 'en']) {
  test(`${language} workspace and filled controls fit phone, tablet and desktop widths`, async ({ page }) => {
    await open(page, language)
    const templates = page.locator('.bstarters button')
    await page.locator('.bstarter-pick summary').click()
    await templates.nth(1).click()
    await page.locator('.bstarter-pick summary').click()
    await templates.nth(3).click()
    await page.locator('.bsection-actions .blink').first().click()
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      const outside = await page.locator('.bwrap').evaluate(root => [...root.querySelectorAll<HTMLElement>('input, select, textarea, button')].filter(control => {
        if (control.closest('[inert], .bstrip') || getComputedStyle(control).visibility === 'hidden') return false
        const rect = control.getBoundingClientRect()
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
      }).map(control => control.id || control.getAttribute('aria-label') || control.textContent?.trim()))
      expect(outside, `${language}/${width}`).toEqual([])
    }
  })
}

test('a new phone visit puts field search on the first screen without template instructions pushing it down', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const language of ['ru', 'en']) {
    await open(page, language)
    const search = await page.locator('#bfind-input').boundingBox()
    expect(search!.y + search!.height).toBeLessThan(844)
    await expect(page.locator('.bstarters')).not.toBeVisible()
  }
})

test('a color picker keeps the alpha channel of an imported color', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.locator('#bimport-text').fill('version: 1\nview:\n  app:\n    color: "#80336699"\n')
  await page.getByRole('button', { name: 'Load into the form' }).click()
  await page.locator('[data-path="view.app.color"] input[type=color]').evaluate((input: HTMLInputElement) => { input.value = '#112233'; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await expect(page.locator('#bf-view-app-color')).toHaveValue('#80112233')
  await expect(output(page)).toContainText('color: "#80112233"')
})

test('power-label variants can be duplicated, reordered and undone without losing their text', async ({ page }) => {
  await open(page)
  await page.locator('#b-power-labels .bsec-toggle').click()
  const state = page.locator('[data-path="power-labels.off"]').first()
  await state.getByRole('button', { name: '+ Label', exact: true }).click()
  await page.locator('#bf-power-labels-off-0-title').fill('First label')
  await state.getByRole('button', { name: 'Duplicate variant', exact: true }).click()
  await expect(page.locator('#bf-power-labels-off-1-title')).toHaveValue('First label')
  await page.locator('#bf-power-labels-off-1-title').fill('Second label')
  await state.getByRole('button', { name: 'Move variant up', exact: true }).nth(1).click()
  await expect(page.locator('#bf-power-labels-off-0-title')).toHaveValue('Second label')
  await undo(page)
  await expect(page.locator('#bf-power-labels-off-0-title')).toHaveValue('First label')
  await expect(page.locator('#bf-power-labels-off-1-title')).toHaveValue('Second label')
})

test('malformed card entries can be repaired or removed without dropping other imported entries', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.locator('#bimport-text').fill('version: 1\ncards:\n  - null\n  - 42\n  - type: note\n    id: keep\n    text: Keep this note\n')
  await page.getByRole('button', { name: 'Load into the form' }).click()
  await expect(page.locator('.bcard')).toHaveCount(3)
  const first = page.locator('li[data-path="cards.0"]')
  await expect(first.locator('.bmalformed')).toBeVisible()
  await first.getByRole('button', { name: 'Banner', exact: true }).click()
  await expect(page.locator('#bf-cards-0-id')).toHaveValue('banner-1')
  await expect(output(page)).toContainText('- 42')
  await expect(output(page)).toContainText('Keep this note')
  await undo(page)
  await expect(first.locator('.bmalformed')).toBeVisible()
  await expect(output(page)).toContainText('- null')
  await page.locator('li[data-path="cards.1"]').getByRole('button', { name: 'Remove card entry', exact: true }).click()
  await expect(page.locator('.bcard')).toHaveCount(2)
  await expect(output(page)).toContainText('id: keep')
  await expect(output(page)).not.toContainText('- 42')
})

test('editing an imported wrong-shaped parent writes a real field rather than a hidden array property', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.locator('#bimport-text').fill('version: 1\nprovider: []\n')
  await page.getByRole('button', { name: 'Load into the form' }).click()
  await page.locator('#bf-provider-name').fill('Repaired provider')
  await expect(output(page)).toContainText('name: Repaired provider')
  await expect(page.locator('[data-test=verdict]')).toContainText('Accepted without warnings')
  await undo(page)
  await expect(output(page)).toContainText('provider: []')
})

test('templates and card duplication still work after adding cards and reordering nested items', async ({ page }) => {
  await open(page)
  await page.locator('#b-cards .bsec-toggle').click()
  const add = page.locator('#b-cards .badd')
  await add.getByRole('button', { name: '+ Banner', exact: true }).click()
  await page.locator('#bf-cards-0-title').fill('Keep my banner')
  await add.getByRole('button', { name: '+ Actions', exact: true }).click()
  const actions = page.locator('li[data-path="cards.1"]')
  await actions.getByRole('button', { name: 'Move up', exact: true }).nth(1).click()
  await starter(page, 'Dashboard appearance')
  await expect(output(page)).toContainText('Keep my banner')
  await expect(output(page)).toContainText('color: "#336699"')
  await actions.getByRole('button', { name: 'Duplicate card', exact: true }).click()
  await expect(page.locator('#bf-cards-2-id')).toHaveValue('actions-2')
  await expect(page.locator('#bf-cards-2-items-0-label')).toHaveValue('Support')
  await expect(page.locator('[data-test=verdict]')).toContainText('Accepted without warnings')
})

test('card summaries use the current builder language for localized text', async ({ page }) => {
  for (const language of ['ru', 'en']) {
    await open(page, language)
    await page.locator('.btop-actions button[aria-controls=bimport]').click()
    await page.locator('#bimport-text').fill('version: 1\ncards:\n  - type: banner\n    id: localized\n    title:\n      en: Offer\n      ru: Предложение\n')
    await page.locator('.bimport .bactions button').click()
    await expect(page.locator('.bcard-title')).toHaveText(language === 'ru' ? 'Предложение' : 'Offer')
  }
})
