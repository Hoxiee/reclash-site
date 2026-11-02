<script setup lang="ts">
import type { DocBlock, DocInline } from '~~/shared/docs/types'
const props = defineProps<{ table: Extract<DocBlock, { type: 'table' }>, label: string }>()
const plain = (nodes: DocInline[]): string => nodes.map(node => 'text' in node ? node.text : 'children' in node ? plain(node.children) : ' ').join('').trim()
const wide = computed(() => props.table.head.length > 2)
const labels = computed(() => props.table.head.map(plain))

const root = useTemplateRef<HTMLElement>('root')
const clipped = ref(false)
let observer: ResizeObserver | undefined
function measure() {
  const element = root.value
  if (element) clipped.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
}
onMounted(() => {
  observer = new ResizeObserver(measure)
  observer.observe(root.value!)
  observer.observe(root.value!.firstElementChild!)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="hb-table" :class="{ 'is-wide': wide, 'is-clipped': clipped }" :style="{ '--cols': table.head.length }" tabindex="0" role="region" :aria-label="label" @scroll.passive="measure">
    <table :role="wide ? 'table' : undefined">
      <thead :role="wide ? 'rowgroup' : undefined"><tr :role="wide ? 'row' : undefined"><th v-for="(cell, column) in table.head" :key="column" scope="col" :role="wide ? 'columnheader' : undefined" :style="{ textAlign: table.align[column] || undefined }"><DocsInline :nodes="cell" /></th></tr></thead>
      <tbody :role="wide ? 'rowgroup' : undefined">
        <tr v-for="(row, rowIndex) in table.rows" :key="rowIndex" :role="wide ? 'row' : undefined">
          <td v-for="(cell, column) in row" :key="column" :role="wide ? 'cell' : undefined" :data-label="wide && column ? labels[column] : undefined" :style="{ textAlign: table.align[column] || undefined }"><span><DocsInline :nodes="cell" /></span></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
