<script setup lang="ts">
const props = defineProps<{ to: string }>()
const documentNavigation = computed(() => /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(props.to))
</script>

<template>
  <a v-if="documentNavigation" :href="to"><slot /></a>
  <NuxtLink v-else :to="to" no-prefetch><slot /></NuxtLink>
</template>
