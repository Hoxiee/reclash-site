<script setup lang="ts">
import { nodeAt, textLimits } from '~~/shared/provider/builder/schema'
import { splitPath } from '~~/shared/provider/builder/document'
import { issueText } from '~~/shared/provider/builder/validate'
// Localized text: one string, or a locale map (exact tag, then language, then en, then the first entry).
const props = defineProps<{ path: string, multiline?: boolean, placeholder?: string }>()
const { language, t } = useText()
const { manifest, get, set, issuesAt } = useBuilder()
const id = computed(() => fieldId(props.path))
const limits = computed(() => textLimits(nodeAt(splitPath(props.path), manifest)))
const value = computed(() => get(props.path))
const map = computed(() => value.value && typeof value.value === 'object' ? value.value as Record<string, unknown> : undefined)
const mode = ref<'one' | 'map'>(map.value ? 'map' : 'one')
const rows = ref<string[]>([])
const base = ['en', 'ru']
function syncRows() {
  const keys = Object.keys(map.value ?? {})
  rows.value = [...new Set([...rows.value.filter(tag => keys.includes(tag) || base.includes(tag) || !tag), ...base, ...keys])]
}
watch(map, next => { if (next) { mode.value = 'map'; syncRows() } else if (typeof value.value === 'string') mode.value = 'one' }, { immediate: true })

function write(tags: string[], texts: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const tag of tags) if (tag && texts[tag]) out[tag] = texts[tag]!
  set(props.path, Object.keys(out).length ? out : undefined)
}
const texts = () => Object.fromEntries(Object.entries(map.value ?? {}).map(([key, item]) => [key, String(item ?? '')]))
function switchMode(next: 'one' | 'map') {
  if (next === mode.value) return
  mode.value = next
  if (next === 'map') {
    syncRows()
    const plain = typeof value.value === 'string' ? value.value : ''
    write(rows.value, plain ? { en: plain } : {})
  } else {
    const current = texts()
    set(props.path, current.en || Object.values(current)[0] || undefined)
  }
}
function setRow(tag: string, event: Event) {
  write(rows.value, { ...texts(), [tag]: (event.target as HTMLInputElement).value })
}
function renameRow(index: number, event: Event) {
  const next = (event.target as HTMLInputElement).value.trim()
  const old = rows.value[index]!
  const current = texts()
  if (next === old || (next && rows.value.includes(next))) return
  const text = current[old]
  delete current[old]
  rows.value[index] = next
  if (next && text) current[next] = text
  write(rows.value, current)
}
function addRow() { rows.value.push(''); nextTick(() => document.getElementById(`${id.value}-tag-${rows.value.length - 1}`)?.focus()) }
function removeRow(index: number) {
  const current = texts()
  delete current[rows.value[index]!]
  rows.value.splice(index, 1)
  write(rows.value, current)
}
const plainIssues = computed(() => issuesAt(props.path).map(issue => issueText(issue, language.value)))
const rowIssues = (tag: string) => tag ? issuesAt(`${props.path}.${tag}`).map(issue => issueText(issue, language.value)) : []
const count = (text: unknown) => Array.from(String(text ?? '')).length
</script>

<template>
  <div class="btext">
    <div class="btext-mode" role="group" :aria-label="t('Языки текста', 'Text languages')">
      <button type="button" :aria-pressed="mode === 'one'" @click="switchMode('one')">{{ t('Один текст', 'One text') }}</button>
      <button type="button" :aria-pressed="mode === 'map'" @click="switchMode('map')">{{ t('По языкам', 'Per language') }}</button>
      <span v-if="limits?.maxLength" class="btext-max">{{ t(`до ${limits.maxLength} симв.`, `up to ${limits.maxLength} chars`) }}</span>
    </div>
    <template v-if="mode === 'one'">
      <component :is="multiline ? 'textarea' : 'input'" :id="id" class="input" :rows="multiline ? 3 : undefined" :maxlength="limits?.maxLength"
        :value="typeof value === 'string' ? value : ''" :placeholder="placeholder" autocomplete="off" :aria-invalid="plainIssues.length ? true : undefined"
        @input="set(path, ($event.target as HTMLInputElement).value || undefined)" />
      <p v-for="(issue, index) in plainIssues" :key="index" class="bf-err" role="alert">{{ issue }}</p>
    </template>
    <div v-else class="btext-rows">
      <div v-for="(tag, index) in rows" :key="index" class="btext-row">
        <input :id="`${id}-tag-${index}`" class="input mono btext-tag" :value="tag" :aria-label="t('Код языка', 'Language tag')" placeholder="pt-BR" spellcheck="false" autocomplete="off" @change="renameRow(index, $event)">
        <component :is="multiline ? 'textarea' : 'input'" :id="index === 0 ? id : undefined" class="input" :rows="multiline ? 2 : undefined" :maxlength="limits?.maxLength"
          :value="tag ? String(map?.[tag] ?? '') : ''" :disabled="!tag" :aria-label="t(`Текст: ${tag}`, `Text: ${tag}`)" autocomplete="off"
          :aria-invalid="rowIssues(tag).length ? true : undefined" @input="setRow(tag, $event)" />
        <span class="btext-count" :class="{ 'is-near': limits?.maxLength && count(map?.[tag]) > limits.maxLength * 0.9 }">{{ count(map?.[tag]) }}</span>
        <button v-if="!base.includes(tag)" type="button" class="bicon" :aria-label="t(`Убрать язык ${tag}`, `Remove language ${tag}`)" @click="removeRow(index)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" /></svg></button>
        <span v-else class="bicon-gap" />
        <p v-for="(issue, at) in rowIssues(tag)" :key="at" class="bf-err" role="alert">{{ issue }}</p>
      </div>
      <button type="button" class="blink" @click="addRow">+ {{ t('Ещё язык', 'Add a language') }}</button>
    </div>
  </div>
</template>
