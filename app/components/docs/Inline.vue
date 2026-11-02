<script setup lang="ts">
import type { DocInline } from '~~/shared/docs/types'
defineProps<{ nodes: DocInline[], inLink?: boolean }>()
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <template v-if="node.type === 'text'">{{ node.text }}</template>
    <SiteLink v-else-if="node.type === 'code' && node.href && !inLink" class="hb-ref" :to="node.href"><code>{{ node.text }}</code></SiteLink>
    <code v-else-if="node.type === 'code'">{{ node.text }}</code>
    <br v-else-if="node.type === 'break'">
    <strong v-else-if="node.type === 'strong'"><DocsInline :nodes="node.children" :in-link="inLink" /></strong>
    <em v-else-if="node.type === 'em'"><DocsInline :nodes="node.children" :in-link="inLink" /></em>
    <del v-else-if="node.type === 'del'"><DocsInline :nodes="node.children" :in-link="inLink" /></del>
    <a v-else-if="node.type === 'link' && node.external" class="hb-ext" :href="node.href" target="_blank" rel="noopener noreferrer"><DocsInline :nodes="node.children" in-link /></a>
    <a v-else-if="node.type === 'link' && node.href.endsWith('.json')" :href="node.href"><DocsInline :nodes="node.children" in-link /></a>
    <SiteLink v-else-if="node.type === 'link'" :to="node.href"><DocsInline :nodes="node.children" in-link /></SiteLink>
  </template>
</template>
