<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
usePageMeta('index')
const { language, t } = useText()
</script>

<template>
  <section class="page-intro">
    <p class="eyebrow">{{ t('Ваше подключение. Ваши правила.', 'Your connection. Your rules.') }}</p>
    <h1>ReClash<span class="brand-dot" aria-hidden="true" /></h1>
    <p class="lead">{{ t('Клиент для управления подключениями.', 'A client for managing connections.') }}</p>
    <div class="actions">
      <SiteLink class="button" :to="pagePath(language, 'start')">{{ t('Начать', 'Get started') }}</SiteLink>
      <SiteLink class="button secondary" :to="pagePath(language, 'download')">{{ t('Скачать', 'Download') }}</SiteLink>
    </div>
  </section>
</template>
