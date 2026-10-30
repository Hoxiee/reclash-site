<script setup lang="ts">
import { rcxText, type RcxLanguage } from '~~/shared/site/rcx'
import type { RcxBlock } from '~~/shared/site/rcx-document'
import type { CodeLanguage } from '~~/shared/site/highlight'
const props = defineProps<{ blocks: RcxBlock[], language: RcxLanguage, reveal?: boolean }>()
const t = (ru: string, en: string, zh: string) => rcxText(props.language, ru, en, zh)
const copyLabels = computed(() => ({ idle: t('Копировать', 'Copy', '复制'), done: t('Скопировано', 'Copied', '已复制'), failed: t('Не вышло', 'Could not copy', '复制失败') }))
const codeLanguage = (lang: string): CodeLanguage => lang === 'yaml' ? 'yaml' : 'text'
</script>

<template>
  <template v-for="(block, index) in blocks" :key="index">
    <template v-if="block.type === 'heading'">
      <span v-for="alias in block.aliases" :id="alias" :key="alias" class="rcx-anchor-alias" aria-hidden="true" />
      <component :is="`h${block.level}`" :id="block.id" class="rcx-heading" :data-level="block.level" :data-fade="reveal ? '' : undefined" tabindex="-1">
        <RcxInline :nodes="block.content" />
        <a class="doc-anchor rcx-heading-link" :href="`#${block.id}`" :aria-label="`${t('Ссылка на раздел', 'Link to section', '章节链接')}: ${block.title}`">#</a>
      </component>
    </template>
    <p v-else-if="block.type === 'paragraph'" class="doc-p" :data-fade="reveal ? '' : undefined"><RcxInline :nodes="block.content" /></p>
    <CodeBlock v-else-if="block.type === 'code'" :code="block.text" :lang="codeLanguage(block.lang)" :label="block.lang" :copy-labels="copyLabels" :data-fade="reveal ? '' : undefined" />
    <hr v-else-if="block.type === 'rule'">
    <component :is="block.ordered ? 'ol' : 'ul'" v-else-if="block.type === 'list'" :start="block.ordered ? block.start : undefined">
      <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
        <input v-if="item.checked !== undefined" type="checkbox" :checked="item.checked" disabled :aria-label="t('Пункт списка', 'Checklist item', '清单项目')">
        <RcxBlocks :blocks="item.blocks" :language="language" />
      </li>
    </component>
    <blockquote v-else-if="block.type === 'quote'" :class="block.alert ? `rcx-note rcx-note-${block.alert}` : undefined">
      <RcxBlocks :blocks="block.children" :language="language" />
    </blockquote>
    <div v-else-if="block.type === 'table'" class="rcx-table-scroll doc-table doc-table-scroll" tabindex="0" role="region" :aria-label="t('Таблица с горизонтальной прокруткой', 'Horizontally scrollable table', '可横向滚动的表格')">
      <table>
        <thead><tr><th v-for="(cell, column) in block.head" :key="column" scope="col" :style="{ textAlign: block.align[column] || undefined }"><RcxInline :nodes="cell" /></th></tr></thead>
        <tbody><tr v-for="(row, rowIndex) in block.rows" :key="rowIndex"><td v-for="(cell, column) in row" :key="column" :style="{ textAlign: block.align[column] || undefined }"><RcxInline :nodes="cell" /></td></tr></tbody>
      </table>
    </div>
    <RcxScreenshot v-else-if="block.type === 'screenshot'" :screenshot="block" :language="language" :data-fade="reveal ? '' : undefined" />
    <figure v-else-if="block.type === 'diagram'" class="rcx-diagram">
      <div class="rcx-diagram-scroll" tabindex="0" role="region" :aria-label="block.title">
        <img :src="block.src" :alt="block.title" :width="block.width" :height="block.height" loading="lazy" decoding="async">
      </div>
      <figcaption><a :href="block.src" target="_blank" rel="noopener">{{ t('Открыть схему целиком', 'Open full diagram', '打开完整图表') }}</a></figcaption>
      <details><summary>{{ t('Текстовая версия схемы', 'Diagram source', '图表文本源代码') }}</summary><CodeBlock :code="block.text" lang="text" label="Mermaid" :copy-labels="copyLabels" /></details>
    </figure>
  </template>
</template>
