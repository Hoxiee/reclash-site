<script setup lang="ts">
const route = useRoute()
const { language } = useText()
useHead(() => ({
  htmlAttrs: { class: 'ported' },
  meta: [{ name: 'color-scheme', content: 'dark' }],
  link: [
    { rel: 'stylesheet', href: '/assets/css/site.css' },
    ...['unbounded', 'onest'].map(font => ({
      rel: 'preload' as const, href: `/assets/fonts/${font}-${language.value === 'ru' ? 'cyrillic' : 'latin'}.woff2`,
      as: 'font' as const, type: 'font/woff2', crossorigin: '' as const,
    })),
  ],
}))
</script>

<template>
  <PortedDocument :key="route.path">
    <PortedNav />
    <main id="main" tabindex="-1"><slot /></main>
    <PortedFooter />
  </PortedDocument>
</template>
