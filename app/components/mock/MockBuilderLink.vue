<script setup lang="ts">
import type { MockProfile } from '~~/shared/provider/mocks'
import { pagePath } from '~~/shared/site/routes'
import { builderFragment } from './view'

// Opens the builder with this stand's manifest and routing. Without JavaScript it is a plain link to the builder.
const props = defineProps<{ profile: MockProfile, origin: string, now: number }>()
const { language, t } = useToolText()
const busy = ref(false)
const path = computed(() => pagePath(language.value, 'builder'))

async function open(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  if (busy.value) return
  busy.value = true
  try {
    await navigateTo(`${path.value}#${await builderFragment(props.profile, props.origin, props.now)}`)
  } catch {
    await navigateTo(path.value)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <a class="btn btn-ghost btn-s mock-builder-link" :href="path" :aria-busy="busy || undefined" @click="open">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
    <span>{{ t('Открыть в конструкторе', 'Open in the builder') }}</span>
  </a>
</template>
