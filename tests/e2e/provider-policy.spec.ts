import { test, expect } from '@playwright/test'

for (const language of ['ru', 'en']) {
  test(`required policy is documented and searchable in ${language}`, async ({ page, request }) => {
    await page.goto(`/${language}/docs`)
    const search = page.locator('.doc-toc').getByRole('searchbox')
    await search.fill('lockdown')
    await expect(page.locator('.doc-toc-list li:visible')).toHaveCount(1)
    await page.locator('.doc-toc-list li:visible a').click()
    await expect(page).toHaveURL(/#policy$/)
    await expect(page.locator('#policy h2')).toBeFocused()
    await expect(page.locator('#policy pre')).toContainText('allow: [safe-01]')
    await expect(page.locator('#policy pre')).toContainText('exclude: [com.example.bank]')
    await expect(page.locator('#policy')).toContainText('noglobal')
    await expect(page.locator('#policy')).toContainText('Access control')
    await expect(page.locator('#policy').getByRole('link', { name: 'JSON Schema', exact: true })).toHaveAttribute('href', '/schemas/provider-policy.schema.json')
    const schema = await request.get('/schemas/provider-policy.schema.json')
    expect(schema.status()).toBe(200)
    expect((await schema.json()).properties.version.const).toBe(1)
  })
}

test('provider guide searches body text and YAML rather than only heading keywords', async ({ page }) => {
  await page.goto('/en/docs')
  const search = page.locator('.doc-toc').getByRole('searchbox')
  await search.fill('safe-01')
  await expect(page.locator('.doc-toc-list li:visible a')).toHaveAttribute('href', '#policy')
  await search.fill('personal lists overwritten')
  await expect(page.locator('.doc-toc-list li:visible a')).toHaveAttribute('href', '#policy')
  await search.fill('unfindable phrase 12345')
  await expect(page.locator('.doc-toc').getByRole('status')).toBeVisible()
  await search.fill('')
  await expect(page.locator('.doc-toc-list li:visible')).toHaveCount(7)
})
