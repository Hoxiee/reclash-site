<script setup lang="ts">
import { rcxText, type RcxLanguage } from '~~/shared/site/rcx'
import type { RcxHeading } from '~~/shared/site/rcx-document'
defineProps<{ language: RcxLanguage, headings: RcxHeading[], active: string }>()
</script>

<template>
  <nav class="rcx-contents" :aria-label="rcxText(language, 'На этой странице', 'On this page', '本页目录')">
    <p class="doc-toc-title" data-fade>{{ rcxText(language, 'На этой странице', 'On this page', '本页目录') }}</p>
    <ul class="doc-toc-list"><li v-for="heading in headings" :key="heading.id" :class="{ 'rcx-contents-child': heading.level > 2 }">
      <a :href="`#${heading.id}`" :class="{ 'is-active': active === heading.id }" :aria-current="active === heading.id ? 'location' : undefined">{{ heading.title }}</a>
    </li></ul>
  </nav>
</template>
