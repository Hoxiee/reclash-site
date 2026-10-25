import { test, expect } from '@playwright/test'
import { providerStandard } from '../../shared/provider/standard'

const keys = ['ember', 'aurora', 'nimbus', 'sentinel', 'relay', 'gatekeeper', 'meridian', 'ledger']
const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
})
test.afterEach(() => { expect(errors).toEqual([]) })

for (const [language, heading] of [['ru', 'Мок-подписки'], ['en', 'Mock subscriptions']] as const) {
  test(`mock subscriptions page lists every stand with encoded import links (${language})`, async ({ page }) => {
    await page.goto(`/${language}/mock-subs`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    await expect(page.locator('.mock-warn')).toBeVisible()
    await expect(page.locator('.mock-stand')).toHaveCount(keys.length)
    for (const key of keys) {
      const stand = page.locator(`#mock-${key}`)
      const url = (await stand.locator('.mock-url pre code').textContent())!.trim()
      expect(url).toMatch(new RegExp(`^https?://[^/]+/mock/${key}$`))
      const link = new URL((await stand.locator('.mock-acts a').getAttribute('href'))!)
      expect(link.protocol).toBe('reclash:')
      expect(link.host).toBe('install-config')
      expect(link.searchParams.get('url')).toBe(url)
      expect(link.searchParams.get('name')).toBe((await stand.locator('h3').textContent())!.trim())
    }
    await expect(page.locator('#mock-ember .mock-pv')).toHaveClass(/theme-scope/)
    const ember = page.locator('#mock-ember .mock-yaml')
    await ember.locator('summary').click()
    await expect(ember.locator('pre code')).toContainText('Fake nodes, for testing ReClash only.')
  })
}

test('mock endpoints serve the YAML body with the headers the page shows', async ({ page, request }) => {
  await page.goto('/en/mock-subs')
  for (const key of keys) {
    const rows = await page.locator(`#mock-${key} .mock-hdr`).evaluateAll(items => items.map(item => [
      item.querySelector('dt')!.textContent!.trim(), item.querySelector('dd')!.textContent!.trim(),
    ]))
    const response = await request.get(`/mock/${key}`)
    expect(response.status()).toBe(200)
    const headers = response.headers()
    expect(headers['access-control-allow-origin']).toBe('*')
    expect(headers['cache-control']).toBe('no-store')
    expect(headers['content-type']).toBe('text/yaml; charset=utf-8')
    expect(headers['reclash-subscriptiontype']).toBe('test')
    for (const [name, value] of rows) expect(headers[name!.toLowerCase()], name).toBe(value)
    const supported = new Set(providerStandard.fields.map(field => field.name))
    for (const name of Object.keys(headers).filter(name => name.startsWith('reclash-'))) expect(supported.has(name), name).toBe(true)
    const body = await response.text()
    expect(body.startsWith(`# Mock subscription: ${key}. Fake nodes, for testing ReClash only.\n`)).toBe(true)
    expect(body).toContain('proxy-groups:')
    expect(body).not.toContain('<html')
  }
})
