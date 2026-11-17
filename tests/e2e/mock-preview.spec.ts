import { test, expect } from '@playwright/test'
import { mockProfiles } from '../../shared/provider/mocks'
import { mockPreview } from '../../shared/provider/mockpreview'
import { mockText } from '../../shared/provider/mockview'

// ReClash's confirmation sends this Accept and a browser User-Agent, never a client identity.
const previewAccept = 'text/html,application/xhtml+xml'

for (const profile of mockProfiles) {
  test(`mock stand ${profile.key} exposes the provider preview API to a browser request`, async ({ request }) => {
    const page = await request.get(`/mock/${profile.key}`, { headers: { Accept: previewAccept } })
    expect(page.status()).toBe(200)
    expect(page.headers()['content-type']).toContain('text/html')
    expect(page.headers()['vary']).toContain('Accept')
    const html = await page.text()
    const href = /<link rel="reclash-preview" href="([^"]+)">/.exec(html)?.[1]
    expect(href).toBe(`/mock-preview/${profile.key}.json`)

    const api = await request.get(href!, { headers: { Accept: 'application/json' } })
    expect(api.status()).toBe(200)
    expect(api.headers()['content-type'].split(';')[0]).toBe('application/json')
    const body = await api.json()
    const provider = profile.manifest?.provider as Record<string, unknown> | undefined
    expect(body.version).toBe(1)
    expect(body).toEqual(mockPreview(profile))
    expect(body.provider.name).toBe(mockText(provider?.name, 'en') ?? profile.headers?.title)
    expect(body.subscription).toEqual(typeof provider?.type === 'string' ? { type: provider.type } : undefined)
    if (body.provider.logoUrl) {
      const logo = await request.get(body.provider.logoUrl)
      expect(logo.status()).toBe(200)
      expect(logo.headers()['content-type']).toContain('image/svg+xml')
    }
  })
}

test('mock stand keeps serving YAML to clients that do not ask for a page', async ({ request }) => {
  for (const accept of ['*/*', 'text/yaml', undefined]) {
    const response = await request.get('/mock/ember', accept ? { headers: { Accept: accept } } : {})
    expect(response.headers()['content-type']).toBe('text/yaml; charset=utf-8')
    expect(response.headers()['vary']).toContain('Accept')
    expect(response.headers()['reclash-config']).toMatch(/\/mock-config\/ember\.yaml$/)
    expect(await response.text()).toContain('proxy-groups:')
  }
})
