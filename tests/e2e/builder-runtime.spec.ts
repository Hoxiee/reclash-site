/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

const built = existsSync(new URL('../../public/runtime/preview/index.html', import.meta.url))
const guide = readFileSync(new URL('../../content/docs/en/providers/manifest.md', import.meta.url), 'utf8')
const manifest = /## Full example\s+```yaml\n([\s\S]+?)```/.exec(guide)![1]!

test.describe('the real application preview', () => {
  test.skip(!built, 'Build site_preview from the application checkout to verify the real runtime')
  test.setTimeout(60_000)

  for (const renderer of ['wasm', 'javascript'] as const) {
    test(`${renderer} renders app widgets without contacting provider image hosts`, async ({ page }) => {
      const errors: string[] = []
      const external: string[] = []
      const assets: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      await page.route('**/*', route => {
        const url = new URL(route.request().url())
        if (url.hostname !== '127.0.0.1') {
          external.push(url.href)
          return route.abort()
        }
        if (url.pathname.startsWith('/runtime/preview/')) assets.push(url.pathname)
        return route.continue()
      })
      if (renderer === 'javascript') {
        await page.addInitScript(() => { WebAssembly.validate = () => false })
        await page.setViewportSize({ width: 390, height: 844 })
      }
      await page.goto('/en/builder')
      await expect(page.locator('#bf-provider-name')).toBeEditable({ timeout: 15_000 })
      await page.getByRole('button', { name: 'Import', exact: true }).click()
      await page.locator('#bimport-text').fill(manifest)
      await page.getByRole('button', { name: 'Load into the form' }).click()
      await expect(page.locator('[data-test=verdict]')).toHaveClass(/\bok\b/)
      if (renderer === 'javascript') await page.locator('.bprev-toggle').click()
      else await page.getByRole('button', { name: 'Load the preview' }).click()
      await expect(page.locator('.bprev')).toHaveAttribute('data-ready', '', { timeout: 45_000 })
      const frame = page.frameLocator('iframe.bframe')
      await expect(frame.locator('canvas').first()).toBeVisible()
      expect(assets).toContain(`/runtime/preview/main.dart.${renderer === 'wasm' ? 'wasm' : 'js'}`)

      await page.locator('iframe.bframe').evaluate((element: HTMLIFrameElement) => {
        element.contentWindow?.postMessage({ v: 1, type: 'scenario', scenario: {
          screen: 'home', locale: 'ru', theme: 'dark', connected: true,
          platform: 'android', usedGb: 1e300, totalGb: 1e300, daysLeft: 1e300,
        } }, location.origin)
      })
      for (const screen of ['Widgets', 'Import', 'Home']) {
        await page.getByRole('tab', { name: screen, exact: true }).click()
        await page.waitForTimeout(250)
      }
      await page.locator('.brail-lang').click()
      await page.getByRole('button', { name: 'Dark app theme', exact: true }).click()
      await page.waitForTimeout(500)
      await expect(frame.locator('canvas').first()).toBeVisible()
      expect(external).toEqual([])
      expect(errors).toEqual([])
      expect(assets.filter(path => path === '/runtime/preview/')).toHaveLength(2)
    })
  }
})
