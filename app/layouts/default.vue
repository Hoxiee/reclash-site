<script setup lang="ts">
const { language } = useText()
useHead(() => ({
  meta: [{ name: 'color-scheme', content: 'dark' }],
  link: ['unbounded', 'onest'].map(font => ({
    rel: 'preload' as const, href: `/assets/fonts/${font}-${language.value === 'ru' ? 'cyrillic' : 'latin'}.woff2`,
    as: 'font' as const, type: 'font/woff2', crossorigin: '' as const,
  })),
}))
</script>

<template>
  <PortedDocument>
    <PortedNav />
    <main id="main" tabindex="-1"><slot /></main>
    <PortedFooter />
  </PortedDocument>
</template>
