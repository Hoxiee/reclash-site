<script setup lang="ts">
import { docText, type DocLanguage } from '~~/shared/docs/catalogue'
import type { DocBlock } from '~~/shared/docs/types'
const props = defineProps<{ block: Extract<DocBlock, { type: 'diagram' }>, language: DocLanguage, copyLabels: { idle: string, done: string, failed: string } }>()
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const full = useTemplateRef<{ focus: () => void }>('full')
const open = ref(false)
const labels = computed(() => ({ zoomIn: t('Увеличить', 'Zoom in', '放大'), zoomOut: t('Уменьшить', 'Zoom out', '缩小'), fit: t('По размеру', 'Fit', '适应') }))

async function expand() {
  open.value = true
  dialog.value?.showModal()
  await nextTick()
  full.value?.focus()
}

function backdrop(event: MouseEvent) {
  if (event.target === dialog.value) dialog.value?.close()
}
</script>

<template>
  <figure class="hb-diagram">
    <DocsDiagramView :src="block.src" :title="block.title" :width="block.width" :height="block.height" :labels="labels">
      <button type="button" :aria-label="t('Во весь экран', 'Full screen', '全屏')" :title="t('Во весь экран', 'Full screen', '全屏')" @click="expand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h5v5M9 20H4v-5M20 4l-6 6M4 20l6-6" /></svg></button>
    </DocsDiagramView>
    <figcaption>
      <details><summary>{{ t('Исходник схемы', 'Diagram source', '图表源代码') }}</summary><CodeBlock :code="block.text" lang="text" label="mermaid" :copy-labels="copyLabels" /></details>
    </figcaption>
    <dialog ref="dialog" class="hb-diagram-dialog" :aria-label="block.title" @click="backdrop" @close="open = false">
      <DocsDiagramView v-if="open" ref="full" :src="block.src" :title="block.title" :width="block.width" :height="block.height" :labels="labels" expanded>
        <button type="button" :aria-label="t('Закрыть', 'Close', '关闭')" :title="t('Закрыть', 'Close', '关闭')" @click="dialog?.close()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
      </DocsDiagramView>
    </dialog>
  </figure>
</template>
