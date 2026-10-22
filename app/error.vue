<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
const { t } = useText()
useHead({ title: `${props.error.statusCode} — ReClash` })
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
  <main class="language-chooser">
    <p class="eyebrow">ReClash · {{ error.statusCode }}</p>
    <h1>{{ t('Страница недоступна', 'Page unavailable') }}</h1>
    <a class="button" href="/">{{ t('На главную', 'Back to home') }}</a>
  </main>
</template>
