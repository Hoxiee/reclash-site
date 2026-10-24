<script setup lang="ts">
// Table of contents with a quick filter; the active entry follows the page's scroll-spy.
const props = defineProps<{ sections: Array<{ id: string, title: string, keys: string }>, active: string }>()
const { t } = useText()
const query = ref('')
// The filter needs the client; it stays disabled in the prerendered page until hydration.
const ready = ref(false)
onMounted(() => { ready.value = true })
const needle = computed(() => query.value.trim().toLowerCase())
const visible = (section: { title: string, keys: string }) =>
  !needle.value || `${section.title} ${section.keys}`.toLowerCase().includes(needle.value)
const matches = computed(() => props.sections.filter(visible).length)
const pad = (index: number) => String(index + 1).padStart(2, '0')
</script>

<template>
  <nav class="doc-toc" :aria-label="t('Содержание', 'Contents')">
    <p class="doc-toc-title">{{ t('Содержание', 'Contents') }}</p>
    <label class="doc-toc-filter">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M9 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm4 9.5 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
      <input v-model="query" :disabled="!ready" type="search" :placeholder="t('фильтр…', 'filter…')" :aria-label="t('Фильтр по разделам', 'Filter sections')" autocomplete="off" spellcheck="false">
    </label>
    <ol class="doc-toc-list">
      <li v-for="(section, index) in sections" v-show="visible(section)" :key="section.id">
        <a :href="`#${section.id}`" :aria-current="active === section.id ? 'location' : undefined" :class="{ 'is-active': active === section.id }">
          <span class="doc-toc-n" aria-hidden="true">{{ pad(index) }}</span>
          <span>{{ section.title }}</span>
        </a>
      </li>
    </ol>
    <p v-if="!matches" class="doc-toc-empty" role="status">{{ t('Ничего не нашлось', 'Nothing matches') }}</p>
  </nav>
</template>
