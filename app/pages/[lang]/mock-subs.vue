<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import { mockProfiles } from '~~/shared/provider/mocks'
import { mockTheme } from '~~/shared/provider/mockview'
import '~/assets/css/mock.css'

usePageMeta('mock-subs')
const { language, t } = useText()
const origin = useRuntimeConfig().public.siteOrigin
// Relative expiries are computed once on the server and reused on hydration, matching the build's _headers.
const now = useState('mock-subs-now', () => Date.now())

const stands = mockProfiles.map(profile => ({ profile, swatch: mockTheme(profile) }))
const count = mockProfiles.length
const switcher = computed(() => stands.map(({ profile, swatch }) => ({ key: profile.key, name: profile.name[language.value], style: swatch.style, stock: !swatch.seed })))
</script>

<template>
  <div class="mock-page">
    <PageHero
      :title="t('Мок-подписки', 'Mock subscriptions')"
      :lede="t('Фейковые подписки, чтобы гонять клиент: импорт, показ квоты и срока, оформление под провайдера и объявления — без настоящего провайдера и без реального доступа.', 'Fake subscriptions for exercising the client: import, quota and expiry display, provider theming and announcements, with no real provider and no real access.')"
      glyph="M150 168h100M150 200h100M150 232h60"
    >
      <template #eyebrow>{{ t('Для тестирования', 'For testing') }}</template>
      <template #tags>
        <span class="tag">{{ t(`${count} стендов`, `${count} stands`) }}</span>
        <span class="tag">{{ t('Тестовые данные', 'Test data') }}</span>
        <span class="tag">{{ t('Ничего настоящего', 'Nothing real') }}</span>
        <span class="tag">reclash://</span>
      </template>
      <ProviderTabs page="mock-subs" />
    </PageHero>

    <section class="sub-sec mock-intro" :aria-label="t('Как пользоваться', 'How to use')">
      <div class="wrap two">
        <div class="sec-head">
          <h2 data-words>{{ t('Подписки, которые ничего не открывают.', 'Subscriptions that unlock nothing.') }}</h2>
          <p class="lede" data-fade>{{ t('Каждый стенд — это настоящий HTTP-ответ: профиль mihomo в теле и заголовки ReClash сверху. Импортируйте его и смотрите, как клиент читает квоту, тему, объявления и сигналы сервера.', 'Each stand is a real HTTP response: a mihomo profile in the body and ReClash headers on top. Import it and watch how the client reads quota, theme, announcements and server signals.') }}</p>
          <p class="note warn mock-warn" role="note" data-fade>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 18 16.6H2Zm0 5.4v3.6m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" /></svg>
            <span>{{ t('Это не рабочий доступ. Узлы указывают на 127.0.0.1, ссылки и цифры вымышлены и существуют только для проверки приложения. Не используйте их как подписку.', 'This is not working access. The nodes point to 127.0.0.1, and the links and figures are invented to test the app. Do not use them as a subscription.') }}</span>
          </p>
        </div>
        <div class="mock-intro-side">
          <ol class="mock-how" data-fade>
            <li><span class="mock-how-n">1</span><div><h3>{{ t('Импортируйте стенд', 'Import a stand') }}</h3><p>{{ t('Кнопка «Импорт» открывает ReClash по ссылке reclash://install-config. Или скопируйте URL и добавьте его в «Профили».', 'The Import button opens ReClash through a reclash://install-config link. Or copy the URL and add it under Profiles.') }}</p></div></li>
            <li><span class="mock-how-n">2</span><div><h3>{{ t('Сверьте поведение', 'Check the behavior') }}</h3><p>{{ t('Квота, срок, тема, логотип и объявление приходят в заголовках ответа — они показаны у каждого стенда ровно так, как их отдаёт сервер.', 'Quota, expiry, theme, logo and announcement arrive in the response headers, shown for each stand exactly as the server sends them.') }}</p></div></li>
            <li><span class="mock-how-n">3</span><div><h3>{{ t('Соберите свои', 'Build your own') }}</h3><p>{{ t('Значение каждого заголовка описано в', 'Every header is explained in the') }} <SiteLink class="tlink" :to="pagePath(language, 'reference')">{{ t('справочнике', 'reference') }}</SiteLink>{{ t(', а собрать набор для своей панели поможет', ', and the') }} <SiteLink class="tlink" :to="pagePath(language, 'builder')">{{ t('конструктор', 'builder') }}</SiteLink>{{ t('.', ' assembles a set for your panel.') }}</p></div></li>
          </ol>
          <p class="mock-quota-note" data-fade>{{ t('Квоты здесь — образцы. Настоящая панель отдаёт Subscription-Userinfo сама и для каждого пользователя свой.', 'Quotas here are samples. A real panel sends Subscription-Userinfo itself, different for every user.') }}</p>
        </div>
      </div>
    </section>

    <section class="sub-sec mock-list" :aria-labelledby="'mock-stands-title'">
      <div class="wrap">
        <div class="sec-head mock-list-head">
          <h2 id="mock-stands-title" data-words>{{ t('Стенды', 'The stands') }}</h2>
          <nav class="mock-index" data-fade :aria-label="t('Список стендов', 'Stand list')">
            <a v-for="{ profile, swatch } in stands" :key="profile.key" :href="`#mock-${profile.key}`" class="mock-index-item theme-scope" :style="swatch.style">
              <span class="mock-index-dot" :class="{ 'is-stock': !swatch.seed }" aria-hidden="true" />
              <span class="mock-index-name">{{ profile.name[language] }}</span>
              <span class="mock-index-blurb">{{ profile.blurb[language] }}</span>
            </a>
          </nav>
        </div>
        <MockSwitcher :stands="switcher" />
        <div class="mock-stands">
          <MockStand v-for="(profile, index) in mockProfiles" :key="profile.key" :profile="profile" :index="index" :origin="origin" :now="now" />
        </div>
      </div>
    </section>
  </div>
</template>
