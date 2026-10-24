import { test, expect } from '@playwright/test'

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
      await expect(stand.locator('.mock-acts a')).toHaveAttribute('href', `reclash://install-config?url=${encodeURIComponent(url)}`)
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
    for (const [name, value] of rows) expect(headers[name!.toLowerCase()], name).toBe(value)
    const body = await response.text()
    expect(body.startsWith(`# Mock subscription: ${key}. Fake nodes, for testing ReClash only.\n`)).toBe(true)
    expect(body).toContain('proxy-groups:')
    expect(body).not.toContain('<html')
  }
})
