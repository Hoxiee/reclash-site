<script setup lang="ts">
import { isTranslated, languages, pagePath, pageFromPath, switchLanguage, type Language } from '~~/shared/site/routes'
import { languageKey } from '~~/shared/site/boot'
const route = useRoute()
const router = useRouter()
const { language, t } = useText()
const page = computed(() => pageFromPath(route.path))
const languageNames: Record<Language, string> = { ru: 'Русская версия', en: 'English version', 'zh-CN': '简体中文' }
const chineseAvailable = computed(() => isTranslated('zh-CN', page.value))
const otherLanguages = computed(() => languages.filter(item => item !== language.value && (item !== 'zh-CN' || chineseAvailable.value)))
const mounted = ref(false)
onMounted(() => { mounted.value = true })
// Language links follow hash-only navigation even when the page instance is reused.
const fullPath = computed(() => mounted.value ? router.currentRoute.value.fullPath : route.path)
// An explicit switch becomes the preference the root page redirects to.
function remember(next: Language) {
  try { localStorage.setItem(languageKey, next) } catch { /* Storage may be unavailable. */ }
  // Neutral links such as /download are resolved on the server, which cannot read localStorage.
  document.cookie = `${languageKey}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
}
</script>

<template>
<SiteLink class="skip" to="#main">{{ t("К содержимому", "Skip to content", "跳到内容") }}</SiteLink>

<!-- ============ NAV ============ -->
<header class="nav">
  <nav class="nav-bar" :aria-label="t('Основная навигация', 'Main navigation', '主导航')">
    <SiteLink class="logo" :to="pagePath(language, 'index')" :aria-label="t('ReClash, на главную', 'ReClash, home', 'ReClash，返回首页')">
      <BrandMark class="logo-mark" />
      ReClash
    </SiteLink>
    <ul class="nav-links" data-group data-items=".nav-a" data-cpull="0.06">
      <li><SiteLink class="nav-a" data-mg :to="pagePath(language, 'index')" :aria-current="page === 'index' ? 'page' : undefined"><span class="mg-c">{{ t("Клиент", "Client", "客户端") }}</span></SiteLink></li>
      <li><SiteLink class="nav-a" data-mg :to="pagePath(language, 'start')" :aria-current="page === 'start' ? 'page' : undefined"><span class="mg-c">{{ t("Старт и FAQ", "Start and FAQ", "开始与常见问题") }}</span></SiteLink></li>
      <li><SiteLink class="nav-a" data-mg :to="pagePath(language, 'docs')" :aria-current="page === 'docs' ? 'page' : undefined"><span class="mg-c">{{ t("Документация", "Docs", "文档") }}</span></SiteLink></li>
      <li class="dd">
        <button class="nav-a" data-mg type="button" aria-expanded="false" aria-controls="dd-dev"><span class="mg-c">{{ t("Разработчикам", "Developers", "开发者") }}</span>
          <svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <ul class="dd-panel" id="dd-dev" data-group data-items="a" data-cpull="0.04">
          <li><SiteLink data-mg :to="pagePath(language, 'reference')" :aria-current="page === 'reference' ? 'page' : undefined"><b>{{ t("Заголовки", "Headers", "响应头") }}</b><span class="s">{{ t("Справочник по всем reclash-* и псевдонимам", "Reference for all reclash-* headers and aliases", "所有 reclash-* 响应头及别名的参考") }}</span></SiteLink></li>
          <li><SiteLink data-mg :to="pagePath(language, 'builder')" :aria-current="page === 'builder' ? 'page' : undefined"><b>{{ t("Конструктор", "Builder", "构建器") }}</b><span class="s">{{ t("Собрать reclash.yaml и посмотреть его в приложении", "Build reclash.yaml and see it in the app", "生成 reclash.yaml 并在应用中查看效果") }}</span></SiteLink></li>
          <li><SiteLink data-mg :to="pagePath(language, 'mock-subs')" :aria-current="page === 'mock-subs' ? 'page' : undefined"><b>{{ t("Мок-подписки", "Mock subscriptions", "模拟订阅") }}</b><span class="s">{{ t("Тестовые ответы для проверки клиента", "Sample responses for testing the client", "用于测试客户端的示例响应") }}</span></SiteLink></li>
        </ul>
      </li>
    </ul>
    <div class="lang" data-group data-sticky data-items="a" data-cpull="0" :aria-label="t('Язык', 'Language', '语言')">
            <SiteLink :to="switchLanguage(fullPath, 'ru')" @click="remember('ru')" :aria-current="language === 'ru' ? 'true' : undefined" lang="ru" :aria-label="t('Русская версия', 'Switch to Russian', '切换到俄语')">RU</SiteLink>
      <SiteLink :to="switchLanguage(fullPath, 'en')" @click="remember('en')" :aria-current="language === 'en' ? 'true' : undefined" lang="en" hreflang="en" :aria-label="t('Переключить на английский', 'English version', '切换到英语')">EN</SiteLink>
      <SiteLink v-if="chineseAvailable" :to="switchLanguage(fullPath, 'zh-CN')" @click="remember('zh-CN')" :aria-current="language === 'zh-CN' ? 'true' : undefined" lang="zh-CN" hreflang="zh-CN" :aria-label="t('Китайская версия', 'Chinese version', '简体中文版')">中文</SiteLink>
    </div>
    <SiteLink class="btn btn-primary btn-s" :to="pagePath(language, 'download')" :aria-current="page === 'download' ? 'page' : undefined">{{ t("Скачать", "Download", "下载") }}</SiteLink>
    <button class="burger" type="button" :aria-label="t('Меню', 'Menu', '菜单')" aria-expanded="false" aria-controls="menu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8L20 8M4 16L20 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  </nav>
</header>

<div class="menu" id="menu" :aria-label="t('Меню', 'Menu', '菜单')">
  <ul>
    <li><SiteLink :to="pagePath(language, 'index')">{{ t("Клиент", "Client", "客户端") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'start')">{{ t("Старт и FAQ", "Start and FAQ", "开始与常见问题") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'docs')">{{ t("Документация", "Documentation", "文档") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'download')">{{ t("Скачать", "Download", "下载") }}</SiteLink></li>
  </ul>
  <h4>{{ t("Разработчикам", "Developers", "开发者") }}</h4>
  <ul class="sub">
    <li><SiteLink :to="pagePath(language, 'reference')">{{ t("Заголовки", "Headers", "响应头") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'builder')">{{ t("Конструктор", "Builder", "构建器") }}</SiteLink></li>
    <li><SiteLink :to="pagePath(language, 'mock-subs')">{{ t("Мок-подписки", "Mock subscriptions", "模拟订阅") }}</SiteLink></li>
    <li v-for="other in otherLanguages" :key="other"><SiteLink :to="switchLanguage(fullPath, other)" :lang="other" @click="remember(other)">{{ languageNames[other] }}</SiteLink></li>
  </ul>
</div>
</template>
