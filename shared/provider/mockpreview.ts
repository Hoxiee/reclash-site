import { mockPath, type MockProfile } from './mocks'

// What a stand shows before ReClash adds it: a browser page that links the Provider Preview API, and that API's
// JSON body. Both derive from the stand's response settings, so the confirmation never claims more than the
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
  const r = profile.response
  const provider = r.serviceName ?? r.title ?? profile.name.en
  return {
    version: 1,
    provider: {
      name: provider,
      ...(r.announce && { description: r.announce.ru }),
      ...(r.logo && { logoUrl: `/assets/mock/${r.logo}` }),
      ...(r.supportUrl && { supportUrl: r.supportUrl }),
    },
    ...(r.title && r.title !== provider && { account: { name: r.title } }),
    ...(r.subscriptionType && { subscription: { type: r.subscriptionType } }),
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
