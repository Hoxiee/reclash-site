<script setup lang="ts">
import type { MdAlert, MdBlock } from '~~/shared/site/markdown'
// Release-note blocks from the typed Markdown tree. Everything is interpolated as text, never as HTML.
// `level` is the tag used for the note's top headings, so notes nest under the version heading.
const props = withDefaults(defineProps<{ blocks: MdBlock[], level?: number }>(), { level: 4 })
const { t } = useText()
const tag = (depth: number) => `h${Math.min(6, props.level + Math.max(0, depth - 2))}`
const alerts: Record<MdAlert, [string, string]> = {
  note: ['Примечание', 'Note'], tip: ['Совет', 'Tip'], important: ['Важно', 'Important'],
  warning: ['Внимание', 'Warning'], caution: ['Осторожно', 'Caution'],
}
</script>

<template>
  <template v-for="(block, index) in blocks" :key="index">
    <component :is="tag(block.level)" v-if="block.type === 'heading'" class="md-h"><ReleaseInline :nodes="block.content" /></component>
    <p v-else-if="block.type === 'paragraph'" class="md-p"><ReleaseInline :nodes="block.content" /></p>
    <pre v-else-if="block.type === 'code'" class="md-code"><CodeLines :code="block.text" :hint="block.lang" /></pre>
    <blockquote v-else-if="block.type === 'quote'" class="md-quote" :data-alert="block.alert">
      <b v-if="block.alert" class="md-alert">{{ t(...alerts[block.alert]) }}</b>
      <ReleaseMarkdown :blocks="block.children" :level="level" />
    </blockquote>
    <hr v-else-if="block.type === 'rule'" class="md-hr">
    <component :is="block.ordered ? 'ol' : 'ul'" v-else class="md-list" :start="block.ordered && block.start !== 1 ? block.start : undefined">
      <li v-for="(item, n) in block.items" :key="n" :class="{ 'md-task': item.checked !== undefined }">
        <input v-if="item.checked !== undefined" type="checkbox" disabled :checked="item.checked" :aria-label="item.checked ? t('Готово', 'Done') : t('Не готово', 'Not done')">
        <ReleaseMarkdown :blocks="item.blocks" :level="level" />
      </li>
    </component>
  </template>
</template>
