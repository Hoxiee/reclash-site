<script setup lang="ts">
import { languageScript } from '~~/shared/site/boot'
import { ogImagePath, siteSummary } from '~~/shared/site/seo'
definePageMeta({ layout: false })
const config = useRuntimeConfig()
useSeoMeta({
  title: 'ReClash — open-source mihomo (Clash Meta) client',
  description: siteSummary.en,
  ogTitle: 'ReClash — open-source mihomo (Clash Meta) client',
  ogDescription: siteSummary.en,
  ogType: 'website',
  ogSiteName: 'ReClash',
  ogUrl: `${config.public.siteOrigin}/en`,
  ogImage: `${config.public.siteOrigin}${ogImagePath}`,
  twitterCard: 'summary_large_image',
})
// The visitor's language is picked before paint; the loader covers the redirect.
useHead({
  htmlAttrs: { lang: 'ru' },
  link: [
    { rel: 'canonical', href: `${config.public.siteOrigin}/en` },
    { rel: 'alternate', hreflang: 'ru', href: `${config.public.siteOrigin}/ru` },
    { rel: 'alternate', hreflang: 'en', href: `${config.public.siteOrigin}/en` },
    { rel: 'alternate', hreflang: 'x-default', href: `${config.public.siteOrigin}/en` },
  ],
  script: [{ innerHTML: languageScript, tagPriority: 'critical' }],
})
</script>

<template>
  <main class="lang-gate">
    <h1>ReClash</h1>
    <p lang="en">{{ siteSummary.en }}</p>
    <p lang="ru">{{ siteSummary.ru }}</p>
    <p><NuxtLink to="/ru" lang="ru" no-prefetch>Русский</NuxtLink> · <NuxtLink to="/en" lang="en" no-prefetch>English</NuxtLink></p>
  </main>
</template>
