<script setup lang="ts">
import '~/assets/css/builder.css'

const { title } = usePageMeta('builder')
const { t } = useText()
const ready = ref(false)
</script>

<template>
  <div class="bpage">
    <PageHero
      :title="title"
      :lede="t('Соберите reclash.yaml, проверьте парсером ReClash и посмотрите подписку в предпросмотре.', 'Build reclash.yaml, check it with the ReClash parser and preview the subscription.')"
      glyph="M150 160h100M150 200h70M150 240h100"
    >
      <template #eyebrow>{{ t('Для провайдеров', 'For providers') }}</template>
      <template #tags>
        <span class="tag">reclash.yaml</span>
        <span class="tag">{{ t('Проверка парсером приложения', 'Checked by the app parser') }}</span>
        <span class="tag">{{ t('Всё остаётся в браузере', 'Nothing leaves the browser') }}</span>
      </template>
      <ProviderTabs page="builder" />
    </PageHero>
    <ClientOnly><LazyBuilderTool @ready="ready = true" /></ClientOnly>
    <div v-if="!ready" class="bskel wrap" role="status">
      <span class="sr-only">{{ t('Загружаем конструктор', 'Loading the builder') }}</span>
      <div class="bskel-main" aria-hidden="true"><i class="bskel-bar" /><i v-for="n in 6" :key="n" class="bskel-box" /></div>
      <div class="bskel-side" aria-hidden="true"><i class="bskel-box is-tall" /></div>
    </div>
  </div>
</template>
