<script setup lang="ts">
import type { CodeLanguage } from '~~/shared/site/highlight'
// Monospace block with an optional caption and a copy button that springs to its new label.
const props = defineProps<{ code: string, label?: string, lang?: CodeLanguage }>()
const { t } = useText()
const motion = usePageMotion()
const state = ref<'idle' | 'done' | 'failed'>('idle')
const button = useTemplateRef<HTMLButtonElement>('button')
let timer: ReturnType<typeof setTimeout> | undefined
async function copy() {
  const runtime = motion.value
  const ok = runtime
    ? await runtime.helpers.copyText(props.code)
    : await navigator.clipboard.writeText(props.code).then(() => true, () => false)
  if (!button.value) return
  const apply = () => { state.value = ok ? 'done' : 'failed' }
  if (runtime) runtime.helpers.morphWidth(button.value, apply)
  else apply()
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (button.value && runtime && !runtime.scope.disposed) runtime.helpers.morphWidth(button.value, () => { state.value = 'idle' })
    else state.value = 'idle'
  }, 1800)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="codeblock">
    <div class="codeblock-head">
      <span class="codeblock-label">{{ label }}</span>
      <button ref="button" class="btn btn-ghost btn-s copy-btn" :class="{ 'is-done': state === 'done' }" type="button" @click="copy">
        <svg class="ico-m cp" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v10H9zM5 15V5h10" /></svg>
        <svg class="ico-m ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        <span class="btn-label">{{ state === 'done' ? t('Скопировано', 'Copied') : state === 'failed' ? t('Не вышло', 'Could not copy') : t('Копировать', 'Copy') }}</span>
      </button>
    </div>
    <pre><CodeLines :code="code" :lang="lang" :hint="label" /></pre>
  </div>
</template>
