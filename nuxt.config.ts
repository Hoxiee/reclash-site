import { prerenderRoutes, sitePages } from './shared/site/routes'
import { normalizeOrigin } from './shared/site/seo'
import { writeStaticFiles } from './scripts/static'
import { bootScript } from './shared/site/boot'
import { documentation } from './scripts/docs/vite'
import { docLanguages } from './shared/docs/catalogue'

const siteOrigin = normalizeOrigin(process.env.NUXT_PUBLIC_SITE_ORIGIN)

export default defineNuxtConfig({
  compatibilityDate: '2026-10-22',
  devtools: { enabled: false },
  ssr: true,
  vite: { plugins: [documentation()] },
  css: ['~/assets/css/site.css', '~/assets/css/shell.css', '~/assets/css/brand.css'],
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
        const key = page.path.split('/')[2] || 'index'
        const locales = key === 'docs' ? docLanguages.join('|') : 'ru|en'
        page.path = page.path.replace(/^\/:lang(?:\([^)]*\))?/, `/:lang(${locales})`)
        if (sitePages.some(item => item.key === key) && (page.path.split('/').length <= 3 || key === 'docs')) {
          page.alias = [`/:lang(${locales})/${key}.html`]
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
      meta: [{ name: 'theme-color', content: '#0d0a14' }, { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      script: [{ innerHTML: bootScript, tagPriority: 'critical' }],
    },
  },
})
