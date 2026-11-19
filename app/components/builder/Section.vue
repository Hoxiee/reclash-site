<script setup lang="ts">
import type { FormSection } from '~~/shared/provider/builder/form'
import { kindOf, nodeAt } from '~~/shared/provider/builder/schema'
const props = defineProps<{ section: FormSection }>()
const { language, t } = useToolText()
const { manifest, get, set, issuesAt, reveal, expansion } = useBuilder()
const key = props.section.key
const kind = kindOf(nodeAt([key], {}))
const filled = computed(() => get(key) !== undefined)
const open = ref(key === 'provider' || filled.value)
const count = computed(() => issuesAt(key, true).length)
const root = ref<HTMLElement>()
watch(reveal, target => {
  if (target && (target.path === key || target.path.startsWith(`${key}.`))) open.value = true
})
watch(expansion, target => { if (target) open.value = target.open })
watch(() => manifest[key], (next, previous) => { if (next !== undefined && previous === undefined) open.value = true })
defineExpose({ open: () => { open.value = true }, root })
</script>

<template>
  <section :id="`b-${key}`" ref="root" class="bsec" :data-open="open ? '' : undefined" :data-path="key">
    <h3 class="bsec-h">
      <button type="button" class="bsec-toggle" :aria-expanded="open" :aria-controls="`b-${key}-body`" @click="open = !open">
        <span class="bsec-title">{{ section.title[language] }}</span>
        <code class="bf-key">{{ key }}</code>
        <span class="bsec-sum">{{ section.summary[language] }}</span>
        <span v-if="count" class="bbadge is-bad" :title="t('Ошибки в разделе', 'Problems in this section')">{{ count }}</span>
        <span v-else-if="filled" class="bbadge" :title="t('Раздел заполнен', 'This section has values')">
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.5l4.5-5" /></svg>
          <span class="sr-only">{{ t('заполнен', 'filled') }}</span>
        </span>
        <svg class="bchev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
      </button>
      <button v-if="filled" type="button" class="bicon bsec-clear" :aria-label="t(`Очистить раздел: ${section.title.ru}`, `Clear section: ${section.title.en}`)" :title="t('Убрать все поля раздела; можно отменить', 'Remove every field in this section; you can undo it')" @click="set(key, undefined)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 4.5h9m-7 0V3h5v1.5m-6 0 .5 8.5h6l.5-8.5" /></svg>
      </button>
    </h3>
    <div :id="`b-${key}-body`" class="bfold" :inert="!open"><div class="bfold-in"><div class="bsec-body">
      <BuilderCards v-if="key === 'cards'" />
      <BuilderLabels v-else-if="key === 'power-labels'" />
      <BuilderNode v-else-if="kind === 'group'" :path="key" flat />
      <BuilderField v-else :path="key" />
    </div></div></div>
  </section>
</template>
