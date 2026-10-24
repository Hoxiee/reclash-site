<script setup lang="ts">
import type { MdInline } from '~~/shared/site/markdown'
// Inline Markdown nodes as text and elements; links are already limited to http(s) by the parser.
defineProps<{ nodes: MdInline[] }>()
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <template v-if="node.type === 'text'">{{ node.text }}</template>
    <br v-else-if="node.type === 'break'">
    <code v-else-if="node.type === 'code'" class="md-ic">{{ node.text }}</code>
    <strong v-else-if="node.type === 'strong'"><ReleaseInline :nodes="node.children" /></strong>
    <em v-else-if="node.type === 'em'"><ReleaseInline :nodes="node.children" /></em>
    <del v-else-if="node.type === 'del'"><ReleaseInline :nodes="node.children" /></del>
    <a v-else class="tlink" :href="node.href" target="_blank" rel="noopener noreferrer"><ReleaseInline :nodes="node.children" /></a>
  </template>
</template>
