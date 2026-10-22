import { prerenderRoutes, sitePages } from './shared/site/routes'
import { normalizeOrigin } from './shared/site/seo'
import { writeStaticFiles } from './scripts/static'

const siteOrigin = normalizeOrigin(process.env.NUXT_PUBLIC_SITE_ORIGIN)

export default defineNuxtConfig({
  compatibilityDate: '2026-10-22',
  devtools: { enabled: false },
  ssr: true,
  css: ['~/assets/css/main.css'],
  runtimeConfig: { public: { siteOrigin } },
  experimental: { appManifest: false, payloadExtraction: 'client', prerenderErrorPages: true },
  nitro: {
    preset: 'static',
    prerender: { routes: prerenderRoutes, crawlLinks: false, failOnError: true },
  },
  hooks: {
    'build:manifest'(manifest) {
      for (const chunk of Object.values(manifest)) chunk.prefetch = false
    },
    'pages:extend'(pages) {
      for (const page of pages) {
        if (!page.path.startsWith('/:lang')) continue
        page.path = page.path.replace(/^\/:lang(?:\([^)]*\))?/, '/:lang(ru|en)')
        const key = page.path.split('/')[2] || 'index'
        if (sitePages.some(item => item.key === key)) {
          page.alias = [`/:lang(ru|en)/${key}.html`]
        }
      }
    },
    'nitro:init'(nitro) {
      nitro.hooks.hook('prerender:done', () => writeStaticFiles(nitro.options.output.publicDir, siteOrigin))
    },
  },
  typescript: { strict: true },
  app: {
    head: {
      title: 'ReClash',
      meta: [{ name: 'theme-color', content: '#11131a' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
