<script setup lang="ts">
import { entryFor } from '~~/shared/provider/builder/form'
import { enumOptions, itemsOf, kindOf, nodeAt, resolve } from '~~/shared/provider/builder/schema'
import { splitPath } from '~~/shared/provider/builder/document'
import { issueText } from '~~/shared/provider/builder/validate'
// One manifest value. Its control, limits and options follow the schema node at the path.
const props = defineProps<{ path: string, compact?: boolean }>()
const { language, t } = useText()
const { manifest, get, set, issuesAt } = useBuilder()
const id = computed(() => fieldId(props.path))
const entry = computed(() => entryFor(props.path))
const node = computed(() => resolve(nodeAt(splitPath(props.path), manifest)))
const kind = computed(() => kindOf(node.value))
const value = computed(() => get(props.path))
const key = computed(() => props.path.split('.').filter(part => !/^\d+$/.test(part)).at(-1))
const options = computed(() => kind.value === 'enum-list' ? enumOptions(itemsOf(node.value)) : enumOptions(node.value))
const segmented = computed(() => options.value.join('').length + options.value.length * 4 <= 27)
const deep = computed(() => ['text', 'int-list', 'string-list', 'enum-list', 'enum-pool'].includes(kind.value))
const issues = computed(() => issuesAt(props.path, deep.value).map(issue => issueText(issue, language.value)))
const item = computed(() => itemsOf(node.value))
const canEmpty = computed(() => ['int-list', 'string-list', 'enum-list'].includes(kind.value) && !(node.value?.minItems ?? 0))
const explicitlyEmpty = computed(() => Array.isArray(value.value) && value.value.length === 0)
const isUrl = computed(() => /https/.test(node.value?.pattern ?? '') || node.value?.format === 'uri' || entry.value?.placeholder?.startsWith('https://') === true)

const list = computed(() => Array.isArray(value.value) ? value.value as unknown[] : value.value === undefined ? [] : [value.value])
const draft = ref('')
const editing = ref(false)
const listText = computed(() => list.value.map(String).join(kind.value === 'int-list' ? ', ' : '\n'))
watch(listText, text => { if (!editing.value) draft.value = text }, { immediate: true })

function setText(event: Event) {
  set(props.path, (event.target as HTMLInputElement).value || undefined)
}
function setNumber(event: Event) {
  const raw = (event.target as HTMLInputElement).value.trim()
  set(props.path, raw === '' ? undefined : Number(raw))
}
function setList(event: Event) {
  draft.value = (event.target as HTMLTextAreaElement).value
  const parts = draft.value.split(kind.value === 'int-list' ? /[\s,;]+/ : /\n/).map(part => part.trim()).filter(Boolean)
  set(props.path, parts.length ? parts.map(part => kind.value === 'int-list' && /^-?\d+$/.test(part) ? Number(part) : part) : undefined)
}
function toggle(option: string) {
  const current = list.value.map(String)
  const exclusive = entry.value?.exclusive ?? []
  let next = current.includes(option) ? current.filter(item => item !== option) : [...current.filter(item => !exclusive.includes(item) && !exclusive.includes(option)), option]
  if (kind.value === 'enum-pool') set(props.path, next.length > 1 ? next : next[0])
  else set(props.path, next.length ? next : undefined)
}
function move(index: number, by: number) {
  const next = [...list.value]
  const [moved] = next.splice(index, 1)
  next.splice(index + by, 0, moved)
  set(props.path, next)
}

const color = computed(() => {
  const hex = String(value.value ?? '').replace(/^#/, '')
  return /^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex) ? `#${hex.slice(-6).toLowerCase()}` : '#336699'
})
function setColor(event: Event) {
  const previous = String(value.value ?? '').replace(/^#/, '')
  const alpha = /^[0-9a-f]{8}$/i.test(previous) ? previous.slice(0, 2) : ''
  set(props.path, `#${alpha}${(event.target as HTMLInputElement).value.slice(1)}`.toUpperCase())
}

const pad = (n: number) => String(n).padStart(2, '0')
const localTime = computed(() => {
  if (typeof value.value !== 'number') return ''
  const date = new Date(value.value * 1000)
  return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
})
function setTime(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const time = raw ? new Date(raw).getTime() : Number.NaN
  set(props.path, Number.isNaN(time) ? undefined : Math.floor(time / 1000))
}
const limit = computed(() => {
  const target = kind.value === 'int-list' || kind.value === 'string-list' ? item.value : node.value
  if (target?.minimum !== undefined && target.maximum !== undefined) return `${target.minimum}–${target.maximum}`
  if (target?.minimum !== undefined) return `≥ ${target.minimum}`
  return ''
})
const help = computed(() => [
  entry.value?.help?.[language.value],
  limit.value && kind.value === 'int-list' ? t(`Значения ${limit.value}.`, `Values ${limit.value}.`) : '',
  node.value?.maxItems ? t(`Не больше ${node.value.maxItems}.`, `At most ${node.value.maxItems}.`) : '',
].filter(Boolean).join(' '))
</script>

<template>
  <div class="bf" :class="{ 'is-compact': compact, 'is-wide': kind === 'enum-pool' || kind === 'enum-list' || kind === 'text' || entry?.widget === 'multiline' }" :data-path="path" :data-kind="kind">
    <div class="bf-head">
      <label v-if="!['boolean', 'enum', 'enum-list', 'enum-pool'].includes(kind)" :for="id">{{ entry?.label[language] ?? key }}</label>
      <span v-else :id="`${id}-l`" class="bf-label">{{ entry?.label[language] ?? key }}</span>
      <code class="bf-key">{{ key }}</code>
      <button v-if="value !== undefined" type="button" class="bicon bf-clear" :aria-label="t(`Очистить ${path}`, `Clear ${path}`)" :title="t('Не переопределять это поле', 'Do not override this field')" @click="set(path, undefined)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7" /></svg>
      </button>
    </div>

    <BuilderText v-if="kind === 'text'" :path="path" :multiline="entry?.widget === 'multiline'" :placeholder="entry?.placeholder" />

    <div v-else-if="kind === 'boolean'" class="bseg" role="group" :aria-labelledby="`${id}-l`">
      <button :id="id" type="button" :aria-pressed="value === undefined" @click="set(path, undefined)">{{ t('Не задано', 'Not set') }}</button>
      <button type="button" :aria-pressed="value === true" @click="set(path, true)">{{ t('Да', 'Yes') }}</button>
      <button type="button" :aria-pressed="value === false" @click="set(path, false)">{{ t('Нет', 'No') }}</button>
    </div>

    <div v-else-if="kind === 'enum' && segmented" class="bseg" role="group" :aria-labelledby="`${id}-l`">
      <button :id="id" type="button" :aria-pressed="value === undefined" @click="set(path, undefined)">{{ t('Не задано', 'Not set') }}</button>
      <button v-for="option in options" :key="option" type="button" class="mono" :aria-pressed="value === option" @click="set(path, option)">{{ option }}<i v-if="node?.default === option" class="bseg-def">{{ t('по умолч.', 'default') }}</i></button>
    </div>

    <select v-else-if="kind === 'enum'" :id="id" class="input bf-select" :aria-labelledby="`${id}-l`" :value="value ?? ''" :aria-invalid="issues.length ? true : undefined" @change="setText">
      <option value="">{{ t('Не задано', 'Not set') }}</option>
      <option v-for="option in options" :key="option" :value="option">{{ option }}{{ node?.default === option ? t(' (по умолчанию)', ' (default)') : '' }}</option>
    </select>

    <div v-else-if="kind === 'enum-list' && entry?.ordered" class="bord" role="group" :aria-labelledby="`${id}-l`">
      <ol v-if="list.length" class="bord-list">
        <li v-for="(token, index) in list" :key="String(token)">
          <span class="bord-n">{{ index + 1 }}</span><code>{{ token }}</code>
          <button type="button" class="bicon" :disabled="index === 0" :aria-label="t(`Выше: ${token}`, `Move ${token} up`)" @click="move(index, -1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4" /></svg></button>
          <button type="button" class="bicon" :disabled="index === list.length - 1" :aria-label="t(`Ниже: ${token}`, `Move ${token} down`)" @click="move(index, 1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg></button>
          <button type="button" class="bicon" :aria-label="t(`Убрать ${token}`, `Remove ${token}`)" @click="toggle(String(token))"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" /></svg></button>
        </li>
      </ol>
      <div class="bchips">
        <button v-for="option in options.filter(option => !list.includes(option))" :key="option" type="button" class="bchip" @click="toggle(option)"><span aria-hidden="true">+</span> {{ option }}</button>
      </div>
    </div>

    <div v-else-if="kind === 'enum-list' || kind === 'enum-pool'" class="bchips" role="group" :aria-labelledby="`${id}-l`">
      <button v-for="option in options" :key="option" type="button" class="bchip" :class="{ 'is-x': entry?.exclusive?.includes(option) }" :aria-pressed="list.includes(option)" @click="toggle(option)">{{ option }}</button>
    </div>

    <input v-else-if="kind === 'integer' && entry?.widget !== 'time'" :id="id" class="input" type="number" inputmode="numeric" step="1"
      :min="node?.minimum" :max="node?.maximum" :value="value ?? ''" :placeholder="node?.default !== undefined ? String(node.default) : limit" :aria-invalid="issues.length ? true : undefined" @input="setNumber">

    <div v-else-if="entry?.widget === 'time'" class="btime">
      <input :id="id" class="input" type="datetime-local" :value="localTime" :aria-invalid="issues.length ? true : undefined" @input="setTime">
      <code v-if="typeof value === 'number'" :title="t('Unix-время, секунды', 'Unix time, seconds')">{{ value }}</code>
    </div>

    <div v-else-if="entry?.widget === 'color'" class="bcolor">
      <input type="color" :aria-label="t('Выбрать цвет', 'Choose a color')" :value="color" @input="setColor">
      <input :id="id" class="input mono" :value="value ?? ''" :maxlength="9" :placeholder="entry.placeholder" spellcheck="false" autocomplete="off" :aria-invalid="issues.length ? true : undefined" @input="setText">
    </div>

    <textarea v-else-if="kind === 'int-list' || kind === 'string-list'" :id="id" class="input mono" :rows="kind === 'int-list' ? 1 : Math.min(6, Math.max(2, list.length + 1))"
      :value="draft" :placeholder="entry?.placeholder" spellcheck="false" autocomplete="off" :aria-invalid="issues.length ? true : undefined"
      @focus="editing = true" @blur="editing = false; draft = listText" @input="setList" />

    <textarea v-else-if="entry?.widget === 'multiline'" :id="id" class="input" rows="3" :maxlength="node?.maxLength" :value="String(value ?? '')" :aria-invalid="issues.length ? true : undefined" @input="setText" />

    <input v-else :id="id" class="input" :class="{ mono: isUrl }" :type="isUrl ? 'url' : 'text'" :inputmode="isUrl ? 'url' : undefined" :maxlength="node?.maxLength"
      :value="value ?? ''" :placeholder="entry?.placeholder" spellcheck="false" autocomplete="off" :aria-invalid="issues.length ? true : undefined" @input="setText">

    <div v-if="canEmpty" class="btext-mode blist-mode" role="group" :aria-label="t('Состояние списка', 'List state')">
      <button type="button" :aria-pressed="value === undefined" @click="set(path, undefined)">{{ t('Не переопределять', 'Do not override') }}</button>
      <button type="button" :aria-pressed="explicitlyEmpty" @click="set(path, [])">{{ t('Пустой список', 'Empty list') }} <code>[]</code></button>
    </div>
    <p v-if="explicitlyEmpty" class="bf-help">{{ t('В YAML записан пустой список []; это не отсутствие поля.', 'The YAML contains an empty list []; this is not an unset field.') }}</p>
    <p v-if="help" class="bf-help">{{ help }}</p>
    <p v-for="(issue, index) in kind === 'text' ? [] : issues" :key="index" class="bf-err" role="alert">{{ issue }}</p>
  </div>
</template>
