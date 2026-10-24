<script setup lang="ts">
import { pagePath, pageFromPath, switchLanguage } from '~~/shared/site/routes'
import { languageKey } from '~~/shared/site/boot'
const route = useRoute()
const { language, t } = useText()
const page = computed(() => pageFromPath(route.path))
const otherLanguage = computed(() => language.value === 'ru' ? 'en' : 'ru')
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const fullPath = computed(() => mounted.value ? route.fullPath : route.path)
const languageLink = computed(() => switchLanguage(fullPath.value, otherLanguage.value))
// An explicit switch becomes the preference the root page redirects to.
function remember(next: 'ru' | 'en') {
  try { localStorage.setItem(languageKey, next) } catch { /* Storage may be unavailable. */ }
}
</script>

<template>
<SiteLink class="skip" to="#main">{{ t("К содержимому", "Skip to content") }}</SiteLink>

<!-- ============ NAV ============ -->
<header class="nav">
  <nav class="nav-bar" :aria-label="t('Основная навигация', 'Main navigation')">
    <SiteLink class="logo" :to="pagePath(language, 'index')" :aria-label="t('ReClash, на главную', 'ReClash, home')">
      <BrandMark class="logo-mark" />
      ReClash
    </SiteLink>
    <ul class="nav-links" data-group data-items=".nav-a" data-cpull="0.06">
      <li><SiteLink class="nav-a" data-mg :to="pagePath(language, 'index')" :aria-current="page === 'index' ? 'page' : undefined"><span class="mg-c">{{ t("Клиент", "Client") }}</span></SiteLink></li>
      <li><SiteLink class="nav-a" data-mg :to="pagePath(language, 'gallery')" :aria-current="page === 'gallery' ? 'page' : undefined"><span class="mg-c">{{ t("Галерея", "Gallery") }}</span></SiteLink></li>
      <li><SiteLink class="nav-a" data-mg :to="pagePath(language, 'start')" :aria-current="page === 'start' ? 'page' : undefined"><span class="mg-c">{{ t("Старт и FAQ", "Start and FAQ") }}</span></SiteLink></li>
      <li class="dd">
        <button class="nav-a" data-mg type="button" aria-expanded="false" aria-controls="dd-dev"><span class="mg-c">{{ t("Разработчикам", "Developers") }}</span>
          <svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <ul class="dd-panel" id="dd-dev" data-group data-items="a" data-cpull="0.04">
          <li><SiteLink data-mg :to="pagePath(language, 'docs')" :aria-current="page === 'docs' ? 'page' : undefined"><b>{{ t("Документация", "Documentation") }}</b><span class="s">{{ t("Как провайдер оформляет клиент заголовками", "How providers brand the client with headers") }}</span></SiteLink></li>
          <li><SiteLink data-mg :to="pagePath(language, 'reference')" :aria-current="page === 'reference' ? 'page' : undefined"><b>{{ t("Заголовки", "Headers") }}</b><span class="s">{{ t("Справочник по всем reclash-* и псевдонимам", "Reference for all reclash-* headers and aliases") }}</span></SiteLink></li>
          <li><SiteLink data-mg :to="pagePath(language, 'builder')" :aria-current="page === 'builder' ? 'page' : undefined"><b>{{ t("Конструктор", "Builder") }}</b><span class="s">{{ t("Собрать заголовки и посмотреть превью", "Build headers and see a preview") }}</span></SiteLink></li>
          <li><SiteLink data-mg :to="pagePath(language, 'mock-subs')" :aria-current="page === 'mock-subs' ? 'page' : undefined"><b>{{ t("Мок-подписки", "Mock subscriptions") }}</b><span class="s">{{ t("Тестовые ответы для проверки клиента", "Sample responses for testing the client") }}</span></SiteLink></li>
          <li><SiteLink data-mg :to="pagePath(language, 'report')" :aria-current="page === 'report' ? 'page' : undefined"><b>{{ t("Отчёт подписки", "Subscription report") }}</b><span class="s">{{ t("Что клиент прочитает из вашего ответа", "What the client reads from your response") }}</span></SiteLink></li>
        </ul>
      </li>
    </ul>
    <div class="lang" data-group data-sticky data-items="a" data-cpull="0" :aria-label="t('Язык', 'Language')">
      <SiteLink :to="switchLanguage(fullPath, 'ru')" @click="remember('ru')" :aria-current="language === 'ru' ? 'true' : undefined" lang="ru" :aria-label="t('Русская версия', 'Switch to Russian')">RU</SiteLink>
      <SiteLink :to="switchLanguage(fullPath, 'en')" @click="remember('en')" :aria-current="language === 'en' ? 'true' : undefined" lang="en" hreflang="en" :aria-label="t('Переключить на английский', 'English version')">EN</SiteLink>
    </div>
    <SiteLink class="btn btn-primary btn-s" :to="pagePath(language, 'download')" :aria-current="page === 'download' ? 'page' : undefined">{{ t("Скачать", "Download") }}</SiteLink>
    <button class="burger" type="button" :aria-label="t('Меню', 'Menu')" aria-expanded="false" aria-controls="menu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8L20 8M4 16L20 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  </nav>
</header>

<div class="menu" id="menu" :aria-label="t('Меню', 'Menu')">
  <ul>
    <li><SiteLink :to="pagePath(language, 'index')">{{ t("Клиент", "Client") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'gallery')">{{ t("Галерея", "Gallery") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'start')">{{ t("Старт и FAQ", "Start and FAQ") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'download')">{{ t("Скачать", "Download") }}</SiteLink></li>
  </ul>
  <h4>{{ t("Разработчикам", "Developers") }}</h4>
  <ul class="sub">
    <li><SiteLink :to="pagePath(language, 'docs')">{{ t("Документация", "Documentation") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'reference')">{{ t("Заголовки", "Headers") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'builder')">{{ t("Конструктор", "Builder") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'mock-subs')">{{ t("Мок-подписки", "Mock subscriptions") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'report')">{{ t("Отчёт подписки", "Subscription report") }}</SiteLink></li>
    <li><SiteLink :to="languageLink" :lang="otherLanguage" @click="remember(otherLanguage)">{{ t('English version', 'Русская версия') }}</SiteLink></li>
  </ul>
</div>
</template>
