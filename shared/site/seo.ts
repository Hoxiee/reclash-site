export function normalizeOrigin(value = 'https://reclash.pages.dev'): string {
  const url = new URL(value)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password
    || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Site origin must be an HTTP(S) origin without credentials, path, query or fragment')
  }
  return url.origin
}
