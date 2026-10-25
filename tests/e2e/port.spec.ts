import { test, expect } from '@playwright/test'
const releasesURL = 'https://api.github.com/repos/Hoxiee/ReClash/releases?per_page=10'
const tagURL = (tag: string) => `https://github.com/Hoxiee/ReClash/releases/tag/${tag}`
// Newest first, as GitHub returns them: a prerelease above the current stable release.
const releases = [
  {
    tag_name: 'v1.3.0-beta.1', name: 'Beta', draft: false, prerelease: true, published_at: '2026-10-25T00:00:00Z', html_url: tagURL('v1.3.0-beta.1'),
    body: '## Preview\n- [x] New tunnel engine\n- [ ] Updated docs', assets: [],
  },
  {
    tag_name: 'v1.2.3', name: 'Test release', draft: false, prerelease: false, published_at: '2026-10-22T00:00:00Z', html_url: tagURL('v1.2.3'),
    body: "## What's Changed\n* feat: something by @user in https://github.com/Hoxiee/ReClash/pull/12\n"
      + '* fix: escape <script>window.__pwned = 1</script> and <img src=x onerror="window.__pwned = 2">\n\n'
      + '**Full Changelog**: https://github.com/Hoxiee/ReClash/compare/v1.2.2...v1.2.3',
    assets: [
      { name: 'ReClash-linux-x64.AppImage', size: 2000000, browser_download_url: 'https://example.com/linux.AppImage' },
      { name: 'ReClash-windows-x64-setup.exe', size: 3000000, browser_download_url: 'https://example.com/setup.exe' },
      { name: 'SHA256SUMS.txt', size: 1000, browser_download_url: 'https://example.com/SHA256SUMS.txt' },
    ],
  },
  {
    tag_name: 'v1.2.2', name: 'Fixes', draft: false, prerelease: false, published_at: '2026-10-01T00:00:00Z', html_url: tagURL('v1.2.2'),
    body: '### Fixes\n1. Faster `start`\n2. [Unsafe link](javascript:alert(1))\n\n```yaml\nmode: rule\n```', assets: [],
  },
  { tag_name: 'v1.2.1', name: '', draft: false, prerelease: false, published_at: '2026-09-20T00:00:00Z', html_url: tagURL('v1.2.1'), body: '', assets: [] },
]
const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (/hydration/i.test(message.text())) errors.push(message.text()) })
  await page.route('https://api.github.com/**', route => route.fulfill({ json: releases }))
})
test.afterEach(() => { expect(errors).toEqual([]) })

// Deep links open their item and glide to it; let that finish before using the nav again.
async function backToTop(page: import('@playwright/test').Page) {
  await expect(page.locator('html')).toHaveClass(/is-loaded/)
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.nav')).not.toHaveClass(/is-hidden/)
}

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
  await backToTop(page)
  await page.getByRole('link', { name: 'Переключить на английский' }).click()
  await expect(page).toHaveURL(/\/en\/start(?:\.html|\/)?\?source=faq#faq-flclash$/)
  await expect(page.locator('#faq-flclash')).toHaveAttribute('data-open', '')
  await backToTop(page)
  await page.locator('.nav-links').getByRole('link', { name: 'Gallery', exact: true }).click()
  await expect(page.locator('.g-item')).toHaveCount(8)
  await page.getByRole('button', { name: 'Themes', exact: true }).click()
  await expect(page.locator('.g-item:not(.is-hidden)')).toHaveCount(2)
  await page.getByRole('button', { name: 'Routing', exact: true }).click()
  await expect(page.locator('.g-item:not(.is-hidden)')).toHaveCount(1)
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.locator('.g-item:not(.is-hidden)')).toHaveCount(8)
})

test('builder validates, emits both archive formats and restores shared state across languages', async ({ page }) => {
  await page.goto('/ru/builder')
  await page.locator('#f-name').fill('Тест <service>')
  await expect(page.locator('#b-card .sc-name')).toHaveText('Тест <service>')
  await expect(page.locator('#b-code')).toContainText('ReClash-ServiceName: base64:0KLQtdGB0YIgPHNlcnZpY2U+')
  await page.getByRole('button', { name: 'nginx', exact: true }).click()
  await expect(page.locator('#b-code')).toContainText('add_header ReClash-ServiceName "base64:0KLQtdGB0YIgPHNlcnZpY2U+" always;')
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

test('builder colour stays inside the preview card', async ({ page }) => {
  await page.goto('/en/builder')
  await expect(page.locator('html')).toHaveClass(/is-loaded/)
  const siteHue = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bh').trim())
  const before = await siteHue()
  await page.getByRole('button', { name: /^Theme/ }).click()
  await page.locator('#f-hex').fill('2FD3B6')
  await expect.poll(() => page.locator('#b-card').evaluate(el => getComputedStyle(el).getPropertyValue('--bh').trim())).not.toBe(before)
  expect(await siteHue()).toBe(before)
  expect(await page.evaluate(() => localStorage.getItem('reclash-brand'))).toBeNull()
  await expect(page.locator('#b-code')).toContainText('ReClash-View: app.color:2FD3B6')
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
  expect(requests).toEqual([releasesURL])
})

test('release block stays revealed when GitHub answers after the reveal', async ({ page }) => {
  let answer!: () => void
  const held = new Promise<void>((resolve) => { answer = resolve })
  await page.route('https://api.github.com/**', async (route) => { await held; await route.fulfill({ json: releases }) })
  await page.goto('/en/download')
  const block = page.locator('#release')
  await expect(block).toHaveClass(/is-in/)
  await expect(block).toHaveAttribute('aria-busy', 'true')
  answer()
  await expect(page.locator('.rel-ver')).toHaveText('v1.2.3')
  await expect(block).toHaveAttribute('data-state', 'ready')
  await expect(block).toHaveClass(/is-in/)
  await expect(block).toHaveCSS('opacity', '1')
})

test('release failure keeps the block visible and links to GitHub', async ({ page }) => {
  await page.route('https://api.github.com/**', route => route.fulfill({ status: 403, json: { message: 'API rate limit exceeded' } }))
  await page.goto('/en/download')
  await expect(page.locator('.rel-ver')).toHaveText('Could not reach GitHub')
  await expect(page.locator('#release .rel-meta').first()).toContainText('temporarily limited')
  await expect(page.locator('#release')).toHaveCSS('opacity', '1')
  await expect(page.locator('#release .assets')).toBeHidden()
  await expect(page.locator('#changelog .cl-fail a')).toHaveAttribute('href', 'https://github.com/Hoxiee/ReClash/releases')
})

test('changelog renders GitHub notes as text and expands earlier releases', async ({ page }) => {
  await page.goto('/en/download#changelog')
  const changelog = page.locator('#changelog')
  await expect(changelog.getByRole('heading', { level: 2, name: "What's new." })).toBeVisible()
  await expect(changelog.locator('.cl-ver')).toHaveText('v1.2.3')
  await expect(changelog.getByRole('heading', { name: "What's Changed" })).toBeVisible()
  await expect(changelog.locator('.md li').first()).toContainText('feat: something by @user in #12')
  await expect(changelog.getByRole('link', { name: '#12', exact: true })).toHaveAttribute('href', 'https://github.com/Hoxiee/ReClash/pull/12')
  await expect(changelog.getByRole('link', { name: '#12', exact: true })).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(changelog.getByRole('link', { name: 'v1.2.2...v1.2.3' })).toHaveAttribute('href', 'https://github.com/Hoxiee/ReClash/compare/v1.2.2...v1.2.3')
  // Raw HTML is text: the script tag is visible and nothing ran.
  await expect(changelog.locator('.md').first()).toContainText('<script>window.__pwned = 1</script>')
  expect(await changelog.locator('.md script, .md img').count()).toBe(0)
  expect(await page.evaluate(() => (window as { __pwned?: number }).__pwned)).toBeUndefined()

  await expect(changelog.locator('.cl-sub')).toHaveText('Other releases')
  await expect(changelog.locator('.cl-item')).toHaveCount(3)
  await expect(changelog.locator('.cl-item').first()).toContainText('Prerelease')
  const button = changelog.getByRole('button', { name: /v1\.2\.2/ })
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  const panel = changelog.locator(`#${await button.getAttribute('aria-controls')}`)
  await expect(panel.getByRole('heading', { name: 'Fixes' })).toBeVisible()
  await expect(panel.locator('ol li')).toHaveCount(2)
  await expect(panel.locator('code').first()).toHaveText('start')
  await expect(panel.locator('pre.md-code code')).toHaveAttribute('data-lang', 'yaml')
  await expect(panel.locator('pre.md-code code')).toHaveText('mode: rule')
  await expect(panel.getByText('Unsafe link')).toBeVisible()
  expect(await panel.locator('a', { hasText: 'Unsafe link' }).count()).toBe(0)
  await expect.poll(() => panel.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(80)
  await page.keyboard.press('Enter')
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => panel.evaluate(el => el.getBoundingClientRect().height)).toBe(0)

  await changelog.getByRole('button', { name: /v1\.2\.1/ }).click()
  await expect(changelog.getByText('No notes for this release.')).toBeVisible()
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
