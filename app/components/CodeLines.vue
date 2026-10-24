<script setup lang="ts">
import { detectLanguage, highlight, type CodeLanguage } from '~~/shared/site/highlight'
// Highlighted <code> for a <pre>: spans only, so innerText and copy keep the exact snippet.
const props = defineProps<{ code: string, lang?: CodeLanguage, hint?: string }>()
const language = computed(() => props.lang ?? detectLanguage(props.code, props.hint))
const lines = computed(() => highlight(props.code, language.value))
</script>

<template>
  <code class="syn" :data-lang="language"><template v-for="(line, index) in lines" :key="index"><template v-for="(token, at) in line" :key="at"><span v-if="token.kind !== 'text'" :class="`tk-${token.kind}`">{{ token.text }}</span><template v-else>{{ token.text }}</template></template>{{ index < lines.length - 1 ? '\n' : '' }}</template></code>
</template>
