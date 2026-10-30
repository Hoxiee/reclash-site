<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { pageKeyFromPath } from '~~/shared/site/routes'
// Legacy .html aliases and trailing slashes render the same page instance.
const pageKey = (route: RouteLocationNormalizedLoaded) => pageKeyFromPath(route.path)
</script>

<template>
  <SiteLoader />
  <NuxtLayout>
    <NuxtPage :page-key="pageKey" />
  </NuxtLayout>
</template>
