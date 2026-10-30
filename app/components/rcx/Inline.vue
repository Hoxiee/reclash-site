<script setup lang="ts">
import type { MdInline } from '~~/shared/site/markdown'
defineProps<{ nodes: MdInline[] }>()
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <template v-if="node.type === 'text'">{{ node.text }}</template>
    <code v-else-if="node.type === 'code'">{{ node.text }}</code>
    <br v-else-if="node.type === 'break'">
    <strong v-else-if="node.type === 'strong'"><RcxInline :nodes="node.children" /></strong>
    <em v-else-if="node.type === 'em'"><RcxInline :nodes="node.children" /></em>
    <del v-else-if="node.type === 'del'"><RcxInline :nodes="node.children" /></del>
    <SiteLink v-else-if="node.type === 'link'" :to="node.href"><RcxInline :nodes="node.children" /></SiteLink>
  </template>
</template>
