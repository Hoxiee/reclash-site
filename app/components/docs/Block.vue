<script setup lang="ts">
import type { DocBlock } from '~~/shared/site/docs'
// One block of the documentation body, rendered by kind.
defineProps<{ block: DocBlock }>()
const { t } = useText()
const pad = (index: number) => String(index + 1).padStart(2, '0')
</script>

<template>
  <p v-if="block.kind === 'p'" class="doc-p"><DocsInline :text="block.text" /></p>

  <h3 v-else-if="block.kind === 'h3'" class="doc-h3">{{ block.text }}</h3>

  <CodeBlock v-else-if="block.kind === 'code'" class="doc-code" :code="block.code" :label="block.label" />

  <ol v-else-if="block.kind === 'layers'" class="doc-layers">
    <li v-for="(item, index) in block.items" :key="item.term" class="doc-layer" :style="{ '--l': index }">
      <span class="doc-layer-bar" aria-hidden="true" />
      <div class="doc-layer-head"><b>{{ item.term }}</b><span class="doc-layer-tag">{{ item.tag }}</span></div>
      <p><DocsInline :text="item.body" /></p>
    </li>
  </ol>

  <dl v-else-if="block.kind === 'rules'" class="doc-rules">
    <div v-for="(item, index) in block.items" :key="item.term" class="doc-rule">
      <dt><span class="doc-rule-n" aria-hidden="true">{{ pad(index) }}</span>{{ item.term }}</dt>
      <dd><DocsInline :text="item.body" /></dd>
    </div>
  </dl>

  <dl v-else-if="block.kind === 'problems'" class="doc-problems">
    <div v-for="item in block.items" :key="item.term" class="doc-problem">
      <dt>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 18 17H2Z M10 8v4m0 2.5v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" /></svg>
        {{ item.term }}
      </dt>
      <dd><DocsInline :text="item.body" /></dd>
    </div>
  </dl>

  <p v-else-if="block.kind === 'note'" class="note doc-note" :class="{ warn: block.tone === 'warn' }">
    <svg v-if="block.tone === 'warn'" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 18 17H2Z M10 8v4m0 2.5v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" /></svg>
    <svg v-else viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 4v4.5m0 2.6v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
    <span><DocsInline :text="block.text" /></span>
  </p>

  <div v-else-if="block.kind === 'aliases'" class="doc-aliases">
    <div class="doc-aliases-head" aria-hidden="true"><span>{{ block.head[0] }}</span><span>{{ block.head[1] }}</span></div>
    <ul :aria-label="`${block.head[0]} / ${block.head[1]}`">
      <li v-for="row in block.rows" :key="row.label" class="doc-alias">
        <span class="doc-alias-label">{{ row.label }}</span>
        <ol class="doc-chain">
          <li v-for="(link, index) in row.chain" :key="link.text" :class="{ 'is-win': index === 0 }">
            <span v-if="index > 0" class="doc-chain-arrow" aria-hidden="true">&rarr;</span>
            <DocsInline :text="[link]" />
          </li>
        </ol>
      </li>
    </ul>
    <p class="doc-aliases-legend"><span class="doc-dot" aria-hidden="true" />{{ t('Каноническое имя проверяется раньше псевдонима', 'The canonical name is checked before its alias') }}</p>
  </div>

  <figure v-else-if="block.kind === 'table'" class="doc-table">
    <figcaption>{{ block.direction }}</figcaption>
    <div class="doc-table-scroll" tabindex="0" role="region" :aria-label="block.direction">
      <table>
        <thead><tr><th scope="col">{{ block.head[0] }}</th><th scope="col">{{ block.head[1] }}</th></tr></thead>
        <tbody>
          <tr v-for="(row, index) in block.rows" :key="index">
            <td><DocsInline :text="row[0]" /></td>
            <td><DocsInline :text="row[1]" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>

  <ol v-else-if="block.kind === 'steps'" class="doc-steps">
    <li v-for="(item, index) in block.items" :key="index" class="doc-step">
      <span class="doc-step-n" aria-hidden="true">{{ index + 1 }}</span>
      <p><DocsInline :text="item" /></p>
    </li>
  </ol>
</template>
