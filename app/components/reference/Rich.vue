<script setup lang="ts">
// Renders the reference's light markup (`code` and **strong**) as elements, never as HTML.
const props = defineProps<{ text: string }>()
type Part = { kind: 'text' | 'code' | 'strong', value: string }
const parts = computed<Part[]>(() => props.text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).filter(Boolean).map((chunk) => {
  if (chunk.length > 2 && chunk.startsWith('`') && chunk.endsWith('`')) return { kind: 'code', value: chunk.slice(1, -1) }
  if (chunk.length > 4 && chunk.startsWith('**') && chunk.endsWith('**')) return { kind: 'strong', value: chunk.slice(2, -2) }
  return { kind: 'text', value: chunk }
}))
</script>

<template>
  <template v-for="(part, index) in parts" :key="index"><code v-if="part.kind === 'code'">{{ part.value }}</code><strong v-else-if="part.kind === 'strong'">{{ part.value }}</strong><template v-else>{{ part.value }}</template></template>
</template>
