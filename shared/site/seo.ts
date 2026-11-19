export const ogImagePath = '/assets/img/og.png'

export const siteSummary = {
  ru: 'ReClash — открытый клиент для mihomo (Clash Meta) для Windows, macOS, Linux и Android: импорт подписок и узлов, VLESS, оформление провайдера, простая и подробная панели.',
  en: 'ReClash is an open-source mihomo (Clash Meta) client for Windows, macOS, Linux and Android: subscription and node import, VLESS, provider branding, simple and detailed dashboards.',
  'zh-CN': 'ReClash 是开源的 mihomo（Clash Meta）客户端，适用于 Windows、macOS、Linux 和 Android：导入订阅与节点、VLESS、服务商品牌定制、简洁与详细仪表盘。',
} as const

export function normalizeOrigin(value = 'https://reclash.pages.dev'): string {
  const url = new URL(value)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password
    || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Site origin must be an HTTP(S) origin without credentials, path, query or fragment')
  }
  return url.origin
}
