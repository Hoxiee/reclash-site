<script setup lang="ts">
import type { NuxtError } from '#app'
import { pagePath } from '~~/shared/site/routes'
const props = defineProps<{ error: NuxtError }>()
const { language, t } = useText()
useHead({ title: `${props.error.statusCode} — ReClash`, htmlAttrs: { lang: language.value } })
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
  <main class="lang-gate">
    <BrandMark class="gate-mark is-off" />
    <p class="ph-eyebrow">ReClash · {{ error.statusCode }}</p>
    <h1>{{ t('Страница недоступна', 'Page unavailable') }}</h1>
    <p><a class="btn btn-primary btn-s" :href="pagePath(language)">{{ t('На главную', 'Back to home') }}</a></p>
  </main>
</template>
