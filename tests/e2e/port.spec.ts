import { test, expect } from '@playwright/test'
const releaseURL = 'https://api.github.com/repos/Hoxiee/ReClash/releases/latest'
const release = {
  tag_name: 'v1.2.3', name: 'Test release', prerelease: false, published_at: '2026-10-22T00:00:00Z',
  html_url: 'https://github.com/Hoxiee/ReClash/releases/tag/v1.2.3',
  assets: [
    { name: 'ReClash-linux-x64.AppImage', size: 2000000, browser_download_url: 'https://example.com/linux.AppImage' },
    { name: 'ReClash-windows-x64-setup.exe', size: 3000000, browser_download_url: 'https://example.com/setup.exe' },
    { name: 'SHA256SUMS.txt', size: 1000, browser_download_url: 'https://example.com/SHA256SUMS.txt' },
  ],
}
const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
  await page.route('https://api.github.com/**', route => route.fulfill({ json: release }))
})
test.afterEach(() => { expect(errors).toEqual([]) })

test('import links, provider theme, FAQ deep links and Nuxt transitions retain archive behavior', async ({ page }) => {
  const network: string[] = []
  page.on('request', request => { if (request.url().startsWith('https://')) network.push(request.url()) })
  await page.goto('/ru')
  await expect(page.locator('#importer .copy-btn')).toBeEnabled()
  await page.locator('#sub-url').fill('https://example.com/sub?token=a&name=b')
  await page.locator('#importer .copy-btn').click()
  await expect(page.locator('#importer code')).toHaveText('reclash://install-config?url=https%3A%2F%2Fexample.com%2Fsub%3Ftoken%3Da%26name%3Db')
  await page.getByRole('button', { name: 'Малиновый', exact: true }).click()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('reclash-brand'))).toBe('FF3D7F')
  await page.locator('#svc-name').fill('Example')
  await expect(page.locator('#studio .sc-name')).toHaveText('Example')
  await expect(page.locator('[data-line="name"] .v')).toHaveText('Example')
  expect(network).toEqual([])
  await page.goto('/ru/start.html?source=faq#faq-flclash')
  await expect(page.locator('#faq-flclash')).toHaveAttribute('data-open', '')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('link', { name: 'Переключить на английский' }).click()
  await expect(page).toHaveURL(/\/en\/start(?:\.html|\/)?\?source=faq#faq-flclash$/)
  await expect(page.locator('#faq-flclash')).toHaveAttribute('data-open', '')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.nav-links').getByRole('link', { name: 'Gallery', exact: true }).click()
  await expect(page.locator('.g-item')).toHaveCount(8)
  await page.getByRole('button', { name: 'Themes', exact: true }).click()
  await expect(page.locator('.g-item:not(.is-hidden)')).toHaveCount(2)
  await page.getByRole('button', { name: 'Bypass', exact: true }).click()
  await expect(page.locator('.g-item:not(.is-hidden)')).toHaveCount(1)
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.locator('.g-item:not(.is-hidden)')).toHaveCount(8)
})

test('builder validates, emits both archive formats and restores shared state across languages', async ({ page }) => {
  await page.goto('/ru/builder')
  await page.locator('#f-name').fill('Тест <service>')
  await expect(page.locator('#b-card .sc-name')).toHaveText('Тест <service>')
  await expect(page.locator('#b-code')).toContainText('ReClash-ServiceName: Тест <service>')
  await page.getByRole('button', { name: 'nginx', exact: true }).click()
  await expect(page.locator('#b-code')).toContainText('add_header ReClash-ServiceName "Тест <service>" always;')
  await page.getByRole('button', { name: /^Ссылки/ }).click()
  await page.locator('#f-buy').fill('http://example.com/renew')
  await expect(page.locator('#f-buy')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#b-code')).not.toContainText('ReClash-BuyPlan')
  await page.locator('#f-buy').fill('https://example.com/renew')
  await expect(page.locator('#b-code')).toContainText('ReClash-BuyPlan')
  await expect.poll(() => page.evaluate(() => {
    try { return JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1))))).buy } catch { return '' }
  })).toBe('https://example.com/renew')
  const hash = new URL(page.url()).hash
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('link', { name: 'Переключить на английский' }).click()
  await expect(page).toHaveURL(new RegExp('/en/builder'))
  await expect(page.locator('#f-name')).toHaveValue('Тест <service>')
  expect(new URL(page.url()).hash).toBe(hash)
  await expect(page.locator('#b-card .sc-btn')).toHaveText('Renew')
  await expect(page.locator('#b-card .sc-btn')).toBeVisible()
})

test('releases load only on download and SHA256 stays local', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => { if (request.url().startsWith('https://')) requests.push(request.url()) })
  await page.goto('/en/gallery')
  expect(requests).toEqual([])
  await page.goto('/en/download')
  await expect(page.locator('.rel-ver')).toHaveText('v1.2.3')
  await expect(page.locator('.assets')).not.toContainText('SHA256SUMS')
  await page.locator('.plat-tabs').getByRole('button', { name: 'Windows' }).click()
  await expect(page.locator('.assets a')).toHaveAttribute('href', 'https://example.com/setup.exe')
  await page.locator('#sums').fill('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  await page.locator('input[type=file]').setInputFiles({ name: 'sample.txt', mimeType: 'text/plain', buffer: Buffer.from('abc') })
  await expect(page.locator('.verdict')).toHaveClass(/ok/)
  await page.locator('#sums').fill('0'.repeat(64))
  await expect(page.locator('.verdict')).toHaveClass(/bad/)
  expect(requests).toEqual([releaseURL])
})

test('motion stops for live reduced motion and disposal; mobile menu supports Escape', async ({ page }) => {
  await page.goto('/ru')
  const ring = page.locator('.hero-svg .ring')
  await expect(ring).toHaveAttribute('d', /^M/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('html')).toHaveClass(/rm/)
  const before = await ring.getAttribute('d')
  await page.waitForTimeout(150)
  expect(await ring.getAttribute('d')).toBe(before)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('html')).not.toHaveClass(/rm/)
  await expect.poll(() => ring.getAttribute('d')).not.toBe(before)
  await page.setViewportSize({ width: 390, height: 844 })
  const burger = page.getByRole('button', { name: 'Меню', exact: true })
  await burger.click()
  await expect(burger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(burger).toHaveAttribute('aria-expanded', 'false')
  await expect(burger).toBeFocused()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.locator('.nav-links').getByRole('link', { name: 'Старт и FAQ', exact: true }).click()
  await expect(page.locator('.hero')).toHaveCount(0)
  await page.locator('.logo').first().click()
  await expect(page.locator('.hero-svg .ring')).toHaveAttribute('d', /^M/)
  await expect(page.locator('.lang > .mg-ind')).toHaveCount(1)
})
