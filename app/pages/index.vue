<script setup lang="ts">
import { languageScript } from '~~/shared/site/boot'
definePageMeta({ layout: false })
const config = useRuntimeConfig()
useSeoMeta({ title: 'ReClash', description: 'ReClash — клиент для ваших подключений. A client for your connections.' })
// The visitor's language is picked before paint; the loader covers the redirect.
useHead({
  htmlAttrs: { lang: 'ru' },
  link: [
    { rel: 'canonical', href: `${config.public.siteOrigin}/` },
    { rel: 'alternate', hreflang: 'ru', href: `${config.public.siteOrigin}/ru` },
    { rel: 'alternate', hreflang: 'en', href: `${config.public.siteOrigin}/en` },
    { rel: 'alternate', hreflang: 'x-default', href: `${config.public.siteOrigin}/` },
  ],
  script: [{ innerHTML: languageScript, tagPriority: 'critical' }],
})
</script>

<template>
  <main class="lang-gate">
    <h1>ReClash</h1>
    <p><NuxtLink to="/ru" lang="ru" no-prefetch>Русский</NuxtLink> · <NuxtLink to="/en" lang="en" no-prefetch>English</NuxtLink></p>
  </main>
</template>
