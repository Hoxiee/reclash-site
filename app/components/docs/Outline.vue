<script setup lang="ts">
import { docText, type DocLanguage } from '~~/shared/docs/catalogue'
import type { DocHeading } from '~~/shared/docs/types'
const props = defineProps<{ language: DocLanguage, headings: DocHeading[], active: string }>()
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
const sectionOf = (index: number) => props.headings.slice(0, index + 1).findLastIndex(heading => heading.level === 2)
const visible = computed(() => {
  const open = sectionOf(props.headings.findIndex(heading => heading.id === props.active))
  return props.headings.filter((heading, index) => heading.level === 2 || sectionOf(index) === open)
})
</script>

<template>
  <nav class="hb-outline" :aria-label="t('На этой странице', 'On this page', '本页内容')">
    <p class="hb-outline-title">{{ t('На этой странице', 'On this page', '本页内容') }}</p>
    <ul>
      <li v-for="heading in visible" :key="heading.id" :data-level="heading.level">
        <a :href="`#${heading.id}`" :class="{ 'is-active': heading.id === active }" :aria-current="heading.id === active ? 'location' : undefined">{{ heading.title }}</a>
      </li>
    </ul>
  </nav>
</template>
