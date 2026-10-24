<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { languageFromPath, pageFromPath } from '~~/shared/site/routes'
// Legacy .html aliases and trailing slashes render the same page instance.
const pageKey = (route: RouteLocationNormalizedLoaded) => `${languageFromPath(route.path)}/${pageFromPath(route.path)}`
</script>

<template>
  <SiteLoader />
  <NuxtLayout>
    <NuxtPage :page-key="pageKey" />
  </NuxtLayout>
</template>
