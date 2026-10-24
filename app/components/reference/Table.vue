<script setup lang="ts">
import type { TokenTable } from '~~/shared/provider/reference'
// Token vocabulary of a structured header (view keys, palette variants, widgets, settings).
const props = defineProps<{ table: TokenTable }>()
const hasNotes = computed(() => props.table.rows.some(row => row.note))
const { language } = useText()
</script>

<template>
  <div class="ref-table-wrap">
    <table class="ref-table">
      <caption>{{ table.caption[language] }}</caption>
      <thead>
        <tr><th v-for="(column, index) in table.columns" :key="index" scope="col" :class="{ 'ref-note-col': hasNotes && index === table.columns.length - 1 }">{{ column[language] }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in table.rows" :key="row.token">
          <th scope="row"><code>{{ row.token }}</code></th>
          <td v-if="row.values" class="ref-values"><code v-for="value in row.values" :key="value">{{ value }}</code></td>
          <td>{{ row.text[language] }}<span v-if="row.note" class="ref-note-inline">{{ row.note[language] }}</span></td>
          <td v-if="row.note" class="ref-faint ref-note-col">{{ row.note[language] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
