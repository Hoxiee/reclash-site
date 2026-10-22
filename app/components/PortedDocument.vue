<script setup lang="ts">
const root = useTemplateRef<HTMLElement>('root')
useMotion(root)
</script>

<template>
  <div ref="root" class="ported-document"><slot /></div>
</template>
