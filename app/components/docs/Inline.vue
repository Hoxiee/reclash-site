<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import type { Rich } from '~~/shared/site/docs'
// Typed inline content: plain text, code (linked to its reference card) and links.
defineProps<{ text: Rich }>()
const { language } = useText()
const reference = computed(() => pagePath(language.value, 'reference'))
</script>

<template>
  <template v-for="(part, index) in text" :key="index">
    <template v-if="part.kind === 'text'">{{ part.text }}</template>
    <SiteLink v-else-if="part.kind === 'code' && part.header" class="doc-hlink" :to="`${reference}#h-${part.header}`"><code>{{ part.text }}</code></SiteLink>
    <code v-else-if="part.kind === 'code'">{{ part.text }}</code>
    <SiteLink v-else-if="part.kind === 'page'" class="tlink" :to="pagePath(language, part.page)">{{ part.text }}</SiteLink>
    <SiteLink v-else-if="part.kind === 'anchor'" class="tlink" :to="`#${part.anchor}`">{{ part.text }}</SiteLink>
    <SiteLink v-else class="tlink" :to="part.href" target="_blank" rel="noopener">{{ part.text }}</SiteLink>
  </template>
</template>
