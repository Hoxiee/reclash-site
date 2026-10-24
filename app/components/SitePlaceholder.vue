<script setup lang="ts">
import type { PageKey } from '~~/shared/site/routes'
const props = defineProps<{ page: PageKey }>()
const { title } = usePageMeta(props.page)
const { t } = useText()
</script>

<template>
  <div>
    <PageHero :title="title" :lede="t('Раздел готовится.', 'This section is coming soon.')">
      <template #eyebrow>ReClash</template>
    </PageHero>
  </div>
</template>
