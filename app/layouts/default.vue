<script setup lang="ts">
import { pagePath, sitePages, switchLanguage } from '~~/shared/site/routes'
const route = useRoute()
const { language, t } = useText()
const otherLanguage = computed(() => language.value === 'ru' ? 'en' : 'ru')
const languageLink = computed(() => switchLanguage(route.fullPath, otherLanguage.value))
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#main">{{ t('К содержимому', 'Skip to content') }}</a>
    <header class="site-header">
      <SiteLink class="brand" :to="pagePath(language)">ReClash<span class="brand-dot" aria-hidden="true" /></SiteLink>
      <SiteLink :to="languageLink" :lang="otherLanguage" :aria-label="t('Переключить на английский', 'Switch to Russian')">
        {{ t('English', 'Русский') }}
      </SiteLink>
    </header>
    <nav class="site-nav" :aria-label="t('Основная навигация', 'Main navigation')">
      <SiteLink v-for="page in sitePages" :key="page.key" :to="pagePath(language, page.key)">
        {{ page.title[language] }}
      </SiteLink>
    </nav>
    <main id="main" tabindex="-1"><slot /></main>
    <footer class="site-footer"><span>ReClash</span><span>{{ t('Клиент для ваших подключений.', 'A client for your connections.') }}</span></footer>
  </div>
</template>
