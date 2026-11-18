<script setup lang="ts">
import { docText, type DocLanguage } from '~~/shared/docs/catalogue'
import type { DocBlock, DocCallout } from '~~/shared/docs/types'
import type { CodeLanguage } from '~~/shared/site/highlight'
const props = defineProps<{ blocks: DocBlock[], language: DocLanguage }>()
const t = (ru: string, en: string, zh?: string) => docText(props.language, ru, en, zh)
const copyLabels = computed(() => ({ idle: t('Копировать', 'Copy', '复制'), done: t('Скопировано', 'Copied', '已复制'), failed: t('Не вышло', 'Could not copy', '复制失败') }))
const highlighters: Record<string, CodeLanguage> = { yaml: 'yaml', json: 'yaml', http: 'http', sh: 'shell' }
const calloutTitles = computed<Record<DocCallout, string>>(() => ({
  note: t('Примечание', 'Note', '注意'), tip: t('Совет', 'Tip', '提示'), important: t('Важно', 'Important', '重要'),
  warning: t('Предупреждение', 'Warning', '警告'), caution: t('Осторожно', 'Caution', '小心'),
}))
const calloutIcons: Record<DocCallout, string> = {
  note: 'M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z',
  tip: 'M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z',
  important: 'M12 7v6m0 4h.01M4 4h16v13H8l-4 4V4Z',
  warning: 'M12 9v4m0 4h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  caution: 'M12 8v5m0 3.5h.01M8.3 2.5h7.4l5.3 5.3v7.4l-5.3 5.3H8.3L3 15.2V7.8l5.3-5.3Z',
}
</script>

<template>
  <template v-for="(block, index) in blocks" :key="index">
    <template v-if="block.type === 'heading'">
      <span v-for="alias in block.aliases" :id="alias" :key="alias" class="hb-alias" aria-hidden="true" />
      <component :is="`h${block.level}`" :id="block.id" class="hb-h" :data-level="block.level" tabindex="-1">
        <DocsInline :nodes="block.content" /><a class="hb-h-link" :href="`#${block.id}`" :aria-label="`${t('Ссылка на раздел', 'Link to section', '章节链接')}: ${block.title}`"></a>
      </component>
    </template>
    <p v-else-if="block.type === 'paragraph'"><DocsInline :nodes="block.content" /></p>
    <CodeBlock v-else-if="block.type === 'code'" class="hb-code" :class="{ 'has-title': block.title }" :code="block.text" :lang="highlighters[block.lang] ?? 'text'" :label="block.title || block.lang" :copy-labels="copyLabels" />
    <hr v-else-if="block.type === 'rule'">
    <component :is="block.ordered ? 'ol' : 'ul'" v-else-if="block.type === 'list'" :start="block.ordered && block.start !== 1 ? block.start : undefined" :class="{ 'hb-tasks': block.items.some(item => item.checked !== undefined) }">
      <li v-for="(item, itemIndex) in block.items" :key="itemIndex" :class="{ 'is-task': item.checked !== undefined }">
        <span v-if="item.checked !== undefined" class="hb-check" :class="{ 'is-checked': item.checked }" role="img" :aria-label="item.checked ? t('Выполнено', 'Done', '已完成') : t('Пункт', 'To do', '待办')" />
        <DocsBlocks :blocks="item.blocks" :language="language" />
      </li>
    </component>
    <aside v-else-if="block.type === 'callout'" class="hb-callout" :data-tone="block.tone" :aria-label="calloutTitles[block.tone]">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="calloutIcons[block.tone]" /></svg>
      <div><p class="hb-callout-title">{{ calloutTitles[block.tone] }}</p><DocsBlocks :blocks="block.children" :language="language" /></div>
    </aside>
    <blockquote v-else-if="block.type === 'quote'"><DocsBlocks :blocks="block.children" :language="language" /></blockquote>
    <DocsTable v-else-if="block.type === 'table'" :table="block" :label="t('Таблица', 'Table', '表格')" />
    <DocsDiagram v-else-if="block.type === 'diagram'" :block="block" :language="language" :copy-labels="copyLabels" />
  </template>
</template>
