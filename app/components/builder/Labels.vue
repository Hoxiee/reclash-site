<script setup lang="ts">
import { formSections } from '~~/shared/provider/builder/form'
import { cloneValue, labelEntries } from '~~/shared/provider/builder/document'
import { issueText } from '~~/shared/provider/builder/validate'
// Power labels: each state holds variants; one is picked per app session. Kept as `{title, hint}` here, compacted on output.
const { language, t } = useText()
const { get, set, issuesAt } = useBuilder()
const states = formSections.find(section => section.key === 'power-labels')!.entries.filter(entry => entry.path.split('.').length === 2)
const placeholders = ['{daysLeft}', '{trafficLeft}', '{server}']
const entries = (path: string) => labelEntries(get(path))
const target = ref<HTMLInputElement | HTMLTextAreaElement>()

function add(path: string) {
  set(path, [...entries(path), { title: '' }])
  const index = entries(path).length - 1
  nextTick(() => document.getElementById(fieldId(`${path}.${index}.title`))?.focus())
}
function remove(path: string, index: number) {
  const next = entries(path).filter((_, at) => at !== index)
  set(path, next.length ? next : undefined)
}
function duplicate(path: string, index: number) {
  const next = [...entries(path)]
  next.splice(index + 1, 0, cloneValue(next[index]!))
  set(path, next)
  nextTick(() => document.getElementById(fieldId(`${path}.${index + 1}.title`))?.focus())
}
function move(path: string, index: number, by: number) {
  const next = [...entries(path)]
  const [entry] = next.splice(index, 1)
  next.splice(index + by, 0, entry!)
  set(path, next)
}
function track(event: FocusEvent) {
  const element = event.target
  if ((element instanceof HTMLInputElement && element.type === 'text') || element instanceof HTMLTextAreaElement) target.value = element
}
function insert(token: string) {
  const element = target.value
  if (!element?.isConnected || element.disabled) return
  const start = element.selectionStart ?? element.value.length
  const end = element.selectionEnd ?? start
  element.setRangeText(token, start, end, 'end')
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.focus()
}
</script>

<template>
  <div class="blabels" @focusin="track">
    <div class="bplace" role="group" :aria-label="t('Подстановки', 'Placeholders')">
      <span>{{ t('Вставить в поле', 'Insert into the field') }}</span>
      <button v-for="token in placeholders" :key="token" type="button" class="bchip mono" :disabled="!target" @mousedown.prevent @click="insert(token)">{{ token }}</button>
    </div>
    <p class="bf-help">{{ t('Подстановка без значения возвращает подпись по умолчанию для всего варианта. Подписи не меняют смысл, цвет и форму кнопки.', 'A placeholder without a value makes the whole entry fall back to the default label. Labels never change the meaning, color or shape of the button.') }}</p>
    <fieldset v-for="state in states" :key="state.path" class="bgroup" :data-path="state.path">
      <legend class="bgroup-head"><span>{{ state.label[language] }}</span><code class="bf-key">{{ state.path.split('.')[1] }}</code></legend>
      <ol v-if="entries(state.path).length" class="bitems">
        <li v-for="(_, index) in entries(state.path)" :key="index" class="bitem" :data-path="`${state.path}.${index}`">
          <div class="bitem-bar">
            <b>{{ entries(state.path).length > 1 ? t(`Вариант ${index + 1}`, `Variant ${index + 1}`) : t('Подпись', 'Label') }}</b>
            <button type="button" class="bicon" :aria-label="t('Дублировать вариант', 'Duplicate variant')" @click="duplicate(state.path, index)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 6h7v7H6zM3 10V3h7" /></svg></button>
            <button type="button" class="bicon" :disabled="index === 0" :aria-label="t('Вариант выше', 'Move variant up')" @click="move(state.path, index, -1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 10 4-4 4 4" /></svg></button>
            <button type="button" class="bicon" :disabled="index === entries(state.path).length - 1" :aria-label="t('Вариант ниже', 'Move variant down')" @click="move(state.path, index, 1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></button>
            <button type="button" class="bicon" :aria-label="t('Удалить вариант', 'Remove variant')" @click="remove(state.path, index)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" /></svg></button>
          </div>
          <div class="bgrid">
            <BuilderField :path="`${state.path}.${index}.title`" />
            <BuilderField :path="`${state.path}.${index}.hint`" />
          </div>
          <p v-for="(issue, at) in issuesAt(`${state.path}.${index}`).map(item => issueText(item, language))" :key="at" class="bf-err" role="alert">{{ issue }}</p>
        </li>
      </ol>
      <button type="button" class="blink" @click="add(state.path)">+ {{ entries(state.path).length ? t('Ещё вариант', 'Another variant') : t('Подпись', 'Label') }}</button>
      <p v-for="(issue, at) in issuesAt(state.path).map(item => issueText(item, language))" :key="at" class="bf-err" role="alert">{{ issue }}</p>
    </fieldset>
  </div>
</template>
