<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
usePageMeta('builder')
const { language, t } = useText()
</script>

<template>
<div>
  <PageHero
    :title="t('Соберите заголовки и сразу посмотрите, что увидит пользователь.', 'Build headers and see what your users will see.')"
    :lede="t('Заполните поля — превью карточки и готовые строки для ответа подписки обновляются на лету. Ссылка на форму сохраняет всё, что вы ввели.', 'Fill in the fields: the card preview and the response lines update as you type. A link to the form keeps everything you entered.')"
    glyph="M150 170h100M150 200h70M150 230h100"
  >
    <template #eyebrow>{{ t('Для провайдеров', 'For providers') }}</template>
    <template #tags>
      <span class="tag">{{ t('Заголовки и nginx', 'Headers and nginx') }}</span>
      <span class="tag">{{ t('Проверка на лету', 'Live validation') }}</span>
      <span class="tag">{{ t('Всё остаётся в браузере', 'Stays in your browser') }}</span>
    </template>
    <ProviderTabs page="builder" />
  </PageHero>
  <section class="sub-sec b-page" style="padding-top:0"><div class="wrap">
    <p class="note b-note" data-fade>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4.5v5m0 2.5v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
      <span>{{ t('Здесь основные поля. Каждый заголовок с форматом, псевдонимами и примерами — в', 'These are the core fields. Every header with its format, aliases and examples is in the') }} <SiteLink class="tlink" :to="pagePath(language, 'reference')">{{ t('справочнике', 'reference') }}</SiteLink>.</span>
    </p>
    <BuilderTool />
  </div></section>
</div>
</template>
