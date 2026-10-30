<script setup lang="ts">
import { rcxPagePath, rcxPages, rcxText, type RcxLanguage } from '~~/shared/site/rcx'
const props = defineProps<{ language: RcxLanguage, slug: string }>()
const sections = computed(() => [
  { id: 'reference', label: rcxText(props.language, 'Концепции и справочник', 'Concepts and reference', '概念与参考') },
  { id: 'editor', label: rcxText(props.language, 'Редактор в приложении', 'In-app editor', '应用内编辑器') },
  { id: 'resources', label: rcxText(props.language, 'Материалы', 'Resources', '资源') },
].map(section => ({ ...section, pages: rcxPages.filter(page => page.section === section.id) })))
</script>

<template>
  <nav class="rcx-chapters" :aria-label="rcxText(language, 'Разделы RCX', 'RCX chapters', 'RCX 章节')">
    <div v-for="section in sections" :key="section.id" class="rcx-chapter-group" data-fade>
      <p class="doc-toc-title">{{ section.label }}</p>
      <ul class="doc-toc-list"><li v-for="page in section.pages" :key="page.slug">
        <SiteLink :to="rcxPagePath(language, page.slug)" :class="{ 'is-active': page.slug === slug }" :aria-current="page.slug === slug ? 'page' : undefined">{{ page.titles[language] }}</SiteLink>
      </li></ul>
    </div>
  </nav>
</template>
