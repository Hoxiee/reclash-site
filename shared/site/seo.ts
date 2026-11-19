export const ogImagePath = '/assets/img/og.png'

export const siteSummary = {
  ru: 'ReClash — открытый клиент для mihomo (Clash Meta) для Windows, macOS, Linux и Android: импорт подписок и узлов, VLESS, оформление провайдера, простая и подробная панели.',
  en: 'ReClash is an open-source mihomo (Clash Meta) client for Windows, macOS, Linux and Android: subscription and node import, VLESS, provider branding, simple and detailed dashboards.',
} as const

export function normalizeOrigin(value = 'https://reclash.pages.dev'): string {
  const url = new URL(value)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password
    || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Site origin must be an HTTP(S) origin without credentials, path, query or fragment')
  }
  return url.origin
}
