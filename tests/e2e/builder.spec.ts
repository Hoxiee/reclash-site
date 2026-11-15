import { test, expect, type Page } from '@playwright/test'

// A stand-in for the app's web build that speaks protocol v1 and records what the host sends it.
const previewStub = `<!doctype html><meta charset="utf-8"><title>stub</title><script>
window.received = []
addEventListener('message', event => { if (event.origin === location.origin && event.source === parent) window.received.push(event.data) })
parent.postMessage({ v: 1, type: 'ready' }, location.origin)
</script>`
// The tool keeps the parser it loaded, so the stub reads a result the test can swap.
const kernelStub = (result: object) => `window.kernelResult = ${JSON.stringify(result)}; window.reclashKernel = { parse: () => JSON.stringify(window.kernelResult) }`

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
  await page.route('**/runtime/preview/', route => route.fulfill({ status: 404, body: '' }))
})
test.afterEach(() => { expect(errors).toEqual([]) })

// The form renders only on the client, after the page shell.
async function open(page: Page, path = '/en/builder') {
  await page.goto(path)
  await expect(page.locator('#bf-provider-name')).toBeEditable({ timeout: 15_000 })
}
const loadPreview = (page: Page) => page.getByRole('button', { name: 'Load the preview' }).click()

test('the shell loads neither the parser nor the preview until they are needed', async ({ page }) => {
  const requested: string[] = []
  page.on('request', request => { if (request.url().includes('/runtime/')) requested.push(new URL(request.url()).pathname) })
  const response = await page.goto('/en/builder')
  const html = await response!.text()
  expect(html).toContain('bskel')
  expect(html).not.toContain('bf-provider-name')
  expect(html).not.toContain('/runtime/')
  await expect(page.locator('#bf-provider-name')).toBeEditable({ timeout: 15_000 })
  await expect(page.locator('.bskel')).toHaveCount(0)
  await page.mouse.wheel(0, 2000)
  await page.waitForTimeout(1500)
  expect(requested).toEqual([])
  await expect(page.locator('.bverdict-wait')).toContainText('after your first edit or import')
  await page.locator('#bf-provider-name').fill('Example VPN')
  await expect(page.locator('[data-test=verdict]')).toBeVisible()
  expect(requested).toEqual(['/runtime/kernel.js'])
})
const output = (page: Page) => page.locator('.bout pre').first()
const received = (page: Page) => page.frameLocator('iframe.bframe').locator('body').evaluate(() => (window as unknown as { received: Record<string, unknown>[] }).received)
const fromPreview = (page: Page, message: object) => page.frameLocator('iframe.bframe').locator('body')
  .evaluate((_, data) => parent.postMessage({ v: 1, ...data }, location.origin), message)

test('a filled field reaches the YAML and the app parser accepts it', async ({ page }) => {
  await open(page)
  await page.locator('#bf-provider-name').fill('Example VPN')
  await expect(output(page)).toContainText('name: Example VPN')
  await expect(page.locator('[data-test=verdict]')).toHaveClass(/\bok\b/)
  await expect(page.locator('[data-test=verdict]')).toContainText('Accepted without warnings')
})

test('import keeps routing as written and reports dropped keys', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.locator('#bimport-text').fill('version: 1\nprovider:\n  name: Imported\n  foo: 1\nrouting:\n  profiles: {}\n')
  await page.getByRole('button', { name: 'Load into the form' }).click()
  await expect(page.locator('[data-test=imported]')).toContainText('Routing is kept as written.')
  await expect(page.locator('[data-test=imported]')).toContainText('provider.foo')
  await expect(page.locator('#bf-provider-name')).toHaveValue('Imported')
  await expect(output(page)).toContainText('routing:')
  await expect(page.locator('#b-routing')).toContainText('Remove routing from the file')
})

test('parser warnings are shown verbatim and a rejection is stated', async ({ page }) => {
  await page.route('**/runtime/kernel.js', route => route.fulfill({ contentType: 'text/javascript', body: kernelStub({ ok: true, warnings: ['Unknown key <b>foo</b> in provider'] }) }))
  await open(page)
  await page.locator('#bf-provider-name').fill('Warned')
  const verdict = page.locator('[data-test=verdict]')
  await expect(verdict).toContainText('Accepted with 1 warning')
  await expect(verdict.locator('code')).toHaveText('Unknown key <b>foo</b> in provider')
  await expect(verdict.locator('code b')).toHaveCount(0)
  await page.evaluate(() => { (window as unknown as { kernelResult: object }).kernelResult = { ok: false, warnings: [] } })
  await page.locator('#bf-provider-name').fill('Again')
  await expect(verdict).toHaveClass(/\bbad\b/)
  await expect(verdict).toContainText('The whole file is rejected')
})

test('the draft survives a reload through the fragment and reset clears it', async ({ page }) => {
  await open(page)
  await page.locator('#bf-provider-name').fill('Kept VPN')
  await expect(page).toHaveURL(/#m=/)
  await page.reload()
  await expect(page.locator('[data-test=verdict]')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('#bf-provider-name')).toHaveValue('Kept VPN')
  const reset = page.locator('.btop-actions .bdanger')
  await reset.click()
  await expect(reset).toHaveText('Clear everything?')
  await expect(page.locator('#bf-provider-name')).toHaveValue('Kept VPN')
  await reset.click()
  await expect(page.locator('#bf-provider-name')).toHaveValue('')
  await expect(page).not.toHaveURL(/#/)
})

test('a missing preview build is explained without breaking the form', async ({ page }) => {
  await open(page)
  await expect(page.locator('iframe.bframe')).toHaveCount(0)
  await loadPreview(page)
  await expect(page.locator('.bstage-note')).toContainText('The preview is not built into this copy of the site.')
  await expect(page.locator('iframe.bframe')).toHaveCount(0)
})

test('the preview speaks protocol v1 both ways', async ({ page }) => {
  await page.unroute('**/runtime/preview/')
  await page.route('**/runtime/preview/', route => route.fulfill({ contentType: 'text/html', body: previewStub }))
  const documents: string[] = []
  page.on('request', request => { if (request.url().includes('/runtime/preview/')) documents.push(`${request.method()} ${new URL(request.url()).pathname}`) })
  await open(page)
  await loadPreview(page)
  await expect.poll(() => documents).toEqual(['HEAD /runtime/preview/', 'GET /runtime/preview/'])
  await expect(page.locator('.bstage-load')).toHaveCount(0)
  await page.mouse.move(1200, 400)
  await page.mouse.wheel(0, 800)
  await expect.poll(async () => (await page.locator('.bprev').boundingBox())!.y).toBeLessThan(100)
  const frame = await page.locator('iframe.bframe').boundingBox()
  expect(frame!.y + frame!.height).toBeLessThanOrEqual(900)
  expect(frame!.height).toBeGreaterThan(500)
  await expect.poll(async () => (await received(page)).map(message => message.type)).toEqual(['manifest', 'scenario'])
  expect((await received(page)).every(message => message.v === 1)).toBe(true)

  await page.locator('#bf-provider-name').pressSequentially('Acme', { delay: 20 })
  await expect.poll(async () => (await received(page)).filter(message => message.type === 'manifest').map(message => message.yaml))
    .toEqual([expect.any(String), expect.stringContaining('name: Acme')])
  await expect.poll(async () => (await received(page)).filter(message => message.type === 'highlight').at(-1)?.path).toBe('provider.name')

  await page.locator('.bprev-bar .bpill').first().click()
  await expect.poll(async () => ((await received(page)).findLast(message => message.type === 'scenario')?.scenario as { connected?: boolean })?.connected).toBe(false)
  const before = (await received(page)).length
  await fromPreview(page, { type: 'connected', connected: true })
  await expect(page.locator('.bprev-bar .bpill').first()).toHaveText('Connected')
  await page.waitForTimeout(300)
  expect((await received(page)).slice(before).filter(message => message.type === 'scenario')).toEqual([])

  await page.locator('#bf-provider-name').blur()
  await fromPreview(page, { type: 'select', path: 'provider.web-url' })
  await expect(page.locator('#bf-provider-web-url')).toBeFocused()

  await fromPreview(page, { type: 'open', kind: 'url', value: 'https://example.com/renew' })
  await expect(page.locator('.bopen')).toContainText('opens https://example.com/renew')

  await page.evaluate(() => window.postMessage({ v: 1, type: 'select', path: 'provider.name' }, location.origin))
  await page.waitForTimeout(300)
  await expect(page.locator('#bf-provider-web-url')).toBeFocused()
})

test('on a phone the preview stays collapsed and its page is requested once, only on a tap', async ({ page }) => {
  const requested: string[] = []
  page.on('request', request => { if (request.url().includes('/runtime/preview/')) requested.push(request.method()) })
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page)
  const toggle = page.locator('.bprev-toggle')
  await toggle.scrollIntoViewIfNeeded()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await page.waitForTimeout(800)
  expect(requested).toEqual([])
  await page.unroute('**/runtime/preview/')
  await page.route('**/runtime/preview/', route => route.fulfill({ contentType: 'text/html', body: previewStub }))
  await toggle.click()
  await expect(page.locator('iframe.bframe')).toBeVisible()
  await expect(page.locator('.bstage-load')).toHaveCount(0)
  await page.waitForTimeout(500)
  expect(requested).toEqual(['HEAD', 'GET'])
})

test('each card type renders its own fields and reaches the YAML', async ({ page }) => {
  await open(page)
  await page.locator('#b-cards .bsec-toggle').click()
  const add = (name: string) => page.locator('#b-cards .badd').getByRole('button', { name: `+ ${name}` }).click()
  const card = (index: number) => page.locator(`#b-cards li[data-path="cards.${index}"]`)

  await add('Banner')
  await expect(card(0).locator('[data-kind="string"][data-path="cards.0"]')).toHaveCount(0)
  await expect(card(0)).not.toContainText('[object Object]')
  await expect(page.locator('#bf-cards-0-layout')).toBeAttached()
  await expect(page.locator('#bf-cards-0-text')).toBeAttached()
  await expect(page.locator('#bf-cards-0-level')).toHaveCount(0)
  await page.locator('#bf-cards-0-title').fill('Spring sale')

  await add('Note')
  await expect(page.locator('#bf-cards-1-level')).toBeAttached()
  await expect(page.locator('#bf-cards-1-title')).toHaveCount(0)
  await page.locator('#bf-cards-1-text').fill('Maintenance tonight')

  await add('Actions')
  await expect(page.locator('#b-cards li[data-path="cards.2.items.1"]')).toBeVisible()
  await expect(page.locator('#bf-cards-2-text')).toHaveCount(0)
  await page.locator('#bf-cards-2-items-0-label').fill('Renew')
  await page.locator('#bf-cards-2-items-1-label').fill('Support')

  const yaml = output(page)
  for (const line of ['type: banner', 'id: banner-1', 'title: Spring sale', 'type: note', 'id: note-1', 'text: Maintenance tonight', 'type: actions', 'id: actions-1', 'label: Renew', 'label: Support']) {
    await expect(yaml).toContainText(line)
  }
  await expect(yaml).not.toContainText('[object Object]')
})

async function servePreview(page: Page, ready = true) {
  await page.unroute('**/runtime/preview/')
  const body = ready ? previewStub : previewStub.replace("parent.postMessage({ v: 1, type: 'ready' }, location.origin)", '')
  await page.route('**/runtime/preview/', route => route.fulfill({ contentType: 'text/html', body }))
}

test('a missing build can be retried without losing the draft', async ({ page }) => {
  await open(page)
  await page.locator('#bf-provider-name').fill('Kept during retry')
  await loadPreview(page)
  await expect(page.locator('.bstage-note')).toContainText('not built into this copy')
  await servePreview(page)
  await page.getByRole('button', { name: 'Retry loading' }).click()
  await expect(page.locator('.bprev')).toHaveAttribute('data-ready', '')
  await expect(page.locator('#bf-provider-name')).toHaveValue('Kept during retry')
  await expect.poll(async () => (await received(page)).find(message => message.type === 'manifest')?.yaml)
    .toEqual(expect.stringContaining('name: Kept during retry'))
})

test('a runtime that never becomes ready times out and can be reloaded', async ({ page }) => {
  await servePreview(page, false)
  await open(page)
  await page.clock.install()
  await loadPreview(page)
  await expect(page.locator('iframe.bframe')).toHaveCount(1)
  await page.clock.fastForward(30_001)
  await expect(page.locator('.bstage-note')).toContainText('Could not load the preview')
  await expect(page.locator('iframe.bframe')).toHaveCount(0)
  await servePreview(page)
  await page.getByRole('button', { name: 'Retry loading' }).click()
  await expect(page.locator('.bprev')).toHaveAttribute('data-ready', '')
})

test('the availability check is bounded when a request stalls', async ({ page }) => {
  await page.unroute('**/runtime/preview/')
  await page.route('**/runtime/preview/', () => {})
  await open(page)
  await page.clock.install()
  await loadPreview(page)
  await expect(page.getByRole('button', { name: 'Load the preview' })).toBeDisabled()
  await page.clock.fastForward(8001)
  await expect(page.locator('.bstage-note')).toContainText('Could not load the preview')
  await expect(page.getByRole('button', { name: 'Retry loading' })).toBeEnabled()
})

test('a delayed runtime receives the latest draft, scenario and field highlight', async ({ page }) => {
  await servePreview(page, false)
  await open(page)
  await loadPreview(page)
  await page.locator('#bf-provider-name').fill('Latest draft')
  await page.getByRole('spinbutton', { name: 'Used GB', exact: true }).fill('42')
  await page.locator('#bf-provider-name').focus()
  await fromPreview(page, { type: 'ready' })
  await expect.poll(async () => (await received(page)).map(message => message.type)).toEqual(['manifest', 'scenario', 'highlight'])
  const messages = await received(page)
  expect(messages[0]?.yaml).toEqual(expect.stringContaining('name: Latest draft'))
  expect((messages[1]?.scenario as { usedGb: number }).usedGb).toBe(42)
  expect(messages[2]?.path).toBe('provider.name')
})

test('the phone preview is a modal with contained focus and Escape restores its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page)
  const trigger = page.locator('.bprev-toggle')
  await trigger.click()
  await expect(page.locator('dialog.bprev:modal')).toBeVisible()
  await page.locator('#bf-provider-name').evaluate(element => element.focus())
  expect(await page.evaluate(() => !!document.activeElement?.closest('#bprev'))).toBe(true)
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate(() => !!document.activeElement?.closest('#bprev'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(await page.evaluate(() => document.documentElement.classList.contains('bprev-locked'))).toBe(false)
})

test('preview screen tabs support arrow keys, Home and End', async ({ page }) => {
  await servePreview(page)
  await open(page)
  const home = page.getByRole('tab', { name: 'Home', exact: true })
  const widgets = page.getByRole('tab', { name: 'Widgets', exact: true })
  const imported = page.getByRole('tab', { name: 'Import', exact: true })
  await home.focus()
  await home.press('ArrowRight')
  await expect(widgets).toBeFocused()
  await expect(widgets).toHaveAttribute('aria-selected', 'true')
  await widgets.press('End')
  await expect(imported).toBeFocused()
  await imported.press('Home')
  await expect(home).toBeFocused()
  await home.press('ArrowLeft')
  await expect(imported).toBeFocused()
})

test('changing between desktop and phone keeps the same preview instance', async ({ page }) => {
  await servePreview(page)
  const documents: string[] = []
  page.on('request', request => { if (request.url().includes('/runtime/preview/')) documents.push(request.method()) })
  await open(page)
  await loadPreview(page)
  await expect(page.locator('.bprev')).toHaveAttribute('data-ready', '')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.bprev-toggle').click()
  await expect(page.locator('dialog.bprev:modal')).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('dialog.bprev:modal')).toHaveCount(0)
  await expect(page.locator('iframe.bframe')).toBeVisible()
  expect(documents).toEqual(['HEAD', 'GET'])
})

test('a failed parser can be retried without editing the file', async ({ page }) => {
  await page.route('**/runtime/kernel.js', route => route.abort())
  await open(page)
  await page.locator('#bf-provider-name').fill('Retry parser')
  await expect(page.locator('.bverdict-wait')).toContainText('The app parser did not load')
  await page.unroute('**/runtime/kernel.js')
  await page.route('**/runtime/kernel.js', route => route.fulfill({ contentType: 'text/javascript', body: kernelStub({ ok: true, warnings: [] }) }))
  await page.getByRole('button', { name: 'Retry the check' }).click()
  await expect(page.locator('[data-test=verdict]')).toContainText('Accepted without warnings')
  await expect(output(page)).toContainText('name: Retry parser')
})

test('draft encoding failures are explained and leave the YAML usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'CompressionStream', { value: class { constructor() { throw new Error('Compression is unavailable') } } })
  })
  await open(page)
  await page.locator('#bf-provider-name').fill('Keep the YAML')
  await expect(page.locator('.bf-err[role=alert]')).toContainText('Could not save the draft')
  await expect(output(page)).toContainText('name: Keep the YAML')
  await page.getByRole('button', { name: 'Draft link', exact: true }).click()
  await expect(page.locator('.btoast')).toContainText('Could not copy the link')
})

test('an older compressed draft cannot restore the hash after reset', async ({ page }) => {
  await page.addInitScript(() => {
    const Native = CompressionStream
    let first = true
    Object.defineProperty(window, 'CompressionStream', { value: class {
      constructor(format: CompressionFormat) {
        const stream = new Native(format)
        if (!first) return stream
        first = false
        const delayed = new TransformStream({ async transform(chunk, controller) {
          await new Promise<void>(resolve => { (window as unknown as { releaseDraft: () => void }).releaseDraft = resolve })
          controller.enqueue(chunk)
        } })
        return { writable: stream.writable, readable: stream.readable.pipeThrough(delayed) }
      }
    } })
  })
  await open(page)
  await page.locator('#bf-provider-name').fill('Old draft')
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { releaseDraft?: () => void }).releaseDraft)).toBe('function')
  const reset = page.locator('.btop-actions .bdanger')
  await reset.click()
  await reset.click()
  await page.evaluate(() => (window as unknown as { releaseDraft: () => void }).releaseDraft())
  await page.waitForTimeout(700)
  await expect(page).not.toHaveURL(/#m=/)
  await expect(page.locator('#bf-provider-name')).toHaveValue('')
})

