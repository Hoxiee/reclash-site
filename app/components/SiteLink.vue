<script setup lang="ts">
import { isReportPath } from '~~/shared/site/routes'
const props = defineProps<{ to: string }>()
const route = useRoute()
const documentNavigation = computed(() => isReportPath(route.path) || isReportPath(props.to))
</script>

<template>
  <a v-if="documentNavigation" :href="to"><slot /></a>
  <NuxtLink v-else :to="to" no-prefetch><slot /></NuxtLink>
</template>
