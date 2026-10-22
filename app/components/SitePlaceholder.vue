<script setup lang="ts">
import type { PageKey } from '~~/shared/site/routes'
const props = defineProps<{ page: PageKey }>()
const { title } = usePageMeta(props.page)
const { t } = useText()
</script>

<template>
  <section class="page-intro">
    <p class="eyebrow">ReClash</p>
    <h1>{{ title }}</h1>
    <p class="lead">{{ t('Раздел готовится.', 'This section is coming soon.') }}</p>
  </section>
</template>
