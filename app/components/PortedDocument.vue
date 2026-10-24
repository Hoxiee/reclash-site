<script setup lang="ts">
const root = useTemplateRef<HTMLElement>('root')
useSiteMotion(root)
</script>

<template>
  <div ref="root" class="ported-document"><slot /></div>
</template>
