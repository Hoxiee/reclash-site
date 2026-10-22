<script setup lang="ts">
definePageMeta({ layout: false })
const config = useRuntimeConfig()
useSeoMeta({ title: 'ReClash', description: 'ReClash — клиент для ваших подключений. A client for your connections.' })
useHead({ htmlAttrs: { lang: 'ru' }, link: [{ rel: 'canonical', href: `${config.public.siteOrigin}/` }] })
</script>

<template>
  <main class="language-chooser">
    <p class="eyebrow">ReClash</p>
    <h1>ReClash<span class="brand-dot" aria-hidden="true" /></h1>
    <p class="lead"><span lang="ru">Выберите язык</span> / <span lang="en">Choose your language</span></p>
    <div class="language-links">
      <NuxtLink to="/ru" lang="ru" no-prefetch>Русский <span aria-hidden="true">→</span></NuxtLink>
      <NuxtLink to="/en" lang="en" no-prefetch>English <span aria-hidden="true">→</span></NuxtLink>
    </div>
  </main>
</template>
