import { mockPath, type MockProfile } from './mocks.ts'
import { mockAssetFile, mockText } from './mockview.ts'

// What a stand shows before ReClash adds it: a browser page that links the Provider Preview API, and that API's
// JSON body. Both derive from the stand's manifest and headers, so the confirmation never claims more than the
// served headers carry.

export const mockPagePath = (key: string) => `/mock-page/${key}`
export const mockPreviewPath = (key: string) => `/mock-preview/${key}.json`

export type MockPreview = {
  version: 1
  provider: { name: string, description?: string, logoUrl?: string, supportUrl?: string }
  account?: { name: string }
  subscription?: { type: string }
}

export function mockPreview(profile: MockProfile): MockPreview {
  const provider = (profile.manifest?.provider ?? {}) as Record<string, unknown>
  const title = profile.headers?.title
  const name = mockText(provider.name, 'en') ?? title ?? profile.name.en
  const announce = (provider.announce as Record<string, unknown> | undefined)?.text ?? profile.headers?.announce
  const logo = typeof provider.logo === 'string' ? provider.logo : undefined
  const support = typeof provider['support-url'] === 'string' ? provider['support-url'] : profile.headers?.supportUrl
  const type = typeof provider.type === 'string' ? provider.type : undefined
  const asset = logo && mockAssetFile(logo)
  return {
    version: 1,
    provider: {
      name,
      ...(announce !== undefined && { description: mockText(announce, 'ru') }),
      ...(logo && { logoUrl: asset ? `/assets/mock/${asset}` : logo }),
      ...(support && { supportUrl: support }),
    },
    ...(title && title !== name && { account: { name: title } }),
    ...(type && { subscription: { type } }),
  }
}

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)

export function mockPage(profile: MockProfile): string {
  const { provider } = mockPreview(profile)
  const name = escapeHtml(provider.name)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${name}</title>
<link rel="reclash-preview" href="${mockPreviewPath(profile.key)}">
</head>
<body>
<h1>${name}</h1>
<p>${escapeHtml(profile.blurb.en)}</p>
<p>A mock subscription with fake nodes, for testing ReClash only. ReClash downloads <code>${mockPath(profile.key)}</code> after you add it.</p>
</body>
</html>
`
}
