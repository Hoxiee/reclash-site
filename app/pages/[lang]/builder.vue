<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
definePageMeta({ layout: 'ported' })
usePageMeta('builder')
const { language, t } = useText()
</script>

<template>
<div>
<div class="wrap">
  <header class="b-head">
    <h1 data-words>{{ t("Соберите заголовки и сразу посмотрите, что увидит пользователь.", "Build headers and see what your users will see.") }}</h1>
    <p class="draft" data-fade><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4.5v5m0 2.5v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <span>{{ t("Черновик. Набор заголовков и превью сейчас перерабатываются, поэтому здесь только основа: схема полей, проверка, вывод для nginx. Полный список — в", "Draft. The header set and preview are being reworked, so this is just the foundation: a field schema, validation and nginx output. The full list is in the") }} <SiteLink class="tlink" :to="pagePath(language, 'reference')">{{ t("справочнике", "reference") }}</SiteLink>.</span></p>
  </header>
  <BuilderTool />
</div>
</div>
</template>
