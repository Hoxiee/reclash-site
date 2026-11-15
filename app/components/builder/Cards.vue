<script setup lang="ts">
import { entryFor } from '~~/shared/provider/builder/form'
import { enumOptions, nodeAt, propertyOrder, resolve } from '~~/shared/provider/builder/schema'
import { issueText } from '~~/shared/provider/builder/validate'
// Cards above the dashboard widgets: add, remove, reorder; each card's fields follow its type's schema branch.
const { language, t } = useText()
const { manifest, get, set, issuesAt, reveal, warnings } = useBuilder()
const cards = computed(() => (Array.isArray(get('cards')) ? get('cards') : []) as Array<Record<string, unknown>>)
const cardsNode = computed(() => resolve(nodeAt(['cards'], manifest)))
const max = computed(() => cardsNode.value?.maxItems ?? 8)
const types = computed(() => enumOptions({ anyOf: (resolve(cardsNode.value?.items)?.oneOf ?? []).map(branch => ({ enum: [resolve(resolve(branch)?.properties?.type)?.const] })) }))
const itemsNode = (index: number) => resolve(nodeAt(['cards', index, 'items'], manifest))
const open = ref<number[]>([])
const typeText: Record<string, [string, string]> = { banner: ['Баннер', 'Banner'], note: ['Заметка', 'Note'], actions: ['Действия', 'Actions'] }

function nextId(type: string) {
  const ids = new Set(cards.value.map(card => card.id))
  let index = 1
  while (ids.has(`${type}-${index}`)) index++
  return `${type}-${index}`
}
function add(type: string) {
  const card: Record<string, unknown> = { type, id: nextId(type) }
  if (type === 'actions') card.items = [{}, {}]
  set('cards', [...cards.value, card])
  open.value = [cards.value.length - 1]
  nextTick(() => document.getElementById(fieldId(`cards.${cards.value.length - 1}.id`))?.focus())
}
function remove(index: number) {
  const next = cards.value.filter((_, at) => at !== index)
  set('cards', next.length ? next : undefined)
  open.value = open.value.filter(at => at !== index).map(at => at > index ? at - 1 : at)
}
function move(index: number, by: number) {
  const next = [...cards.value]
  const [card] = next.splice(index, 1)
  next.splice(index + by, 0, card!)
  set('cards', next)
  open.value = open.value.map(at => at === index ? index + by : at === index + by ? index : at)
}
function retype(index: number, event: Event) {
  const type = (event.target as HTMLSelectElement).value
  const card = cards.value[index]!
  const next: Record<string, unknown> = { type }
  const keys = propertyOrder(nodeAt(['cards', index], { cards: [{ type }] }), { type })
  for (const [key, item] of Object.entries(card)) if (key !== 'type' && keys.includes(key)) next[key] = item
  if (type === 'actions' && !next.items) next.items = [{}, {}]
  set(`cards.${index}`, next)
}
function toggle(index: number) {
  open.value = open.value.includes(index) ? open.value.filter(at => at !== index) : [...open.value, index]
}
const items = (index: number) => (cards.value[index]?.items ?? []) as unknown[]
function addItem(index: number) { set(`cards.${index}.items`, [...items(index), {}]) }
function removeItem(index: number, at: number) { set(`cards.${index}.items`, items(index).filter((_, i) => i !== at)) }
function moveItem(index: number, at: number, by: number) {
  const next = [...items(index)]
  const [item] = next.splice(at, 1)
  next.splice(at + by, 0, item)
  set(`cards.${index}.items`, next)
}
const title = (card: Record<string, unknown>) => {
  const text = card.title ?? card.text ?? ''
  const plain = typeof text === 'string' ? text : Object.values(text as object)[0]
  return String(plain ?? '').split('\n')[0]
}
// The app drops an invalid card alone and says so by its id, or by its position when the id is unusable.
const skippedText = (card: Record<string, unknown>, index: number) => warnings.value.find(warning => warning === `Card ${typeof card.id === 'string' ? card.id : `#${index}`} skipped`)
const skipped = computed(() => cards.value.map((card, index) => skippedText(card, index)).filter((warning): warning is string => !!warning))
const cardIssues = (index: number) => issuesAt(`cards.${index}`, true).length
const listIssues = computed(() => issuesAt('cards').map(issue => issueText(issue, language.value)))
watch(reveal, target => {
  const match = /^cards\.(\d+)/.exec(target?.path ?? '')
  if (match && !open.value.includes(Number(match[1]))) open.value.push(Number(match[1]))
})
</script>

<template>
  <div class="bcards" data-path="cards">
    <p class="bf-help">{{ t(`До ${max} карточек над виджетами, в порядке файла. Карточка с ошибкой пропускается отдельно.`, `Up to ${max} cards above the widgets, in file order. An invalid card is skipped alone.`) }}</p>
    <div v-if="skipped.length" class="note warn bskipped" role="status">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 18 16.6H2Zm0 5.4v3.6m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" /></svg>
      <span>
        {{ t(`Приложение пропустит карточки с ошибками (${skipped.length} из ${cards.length}) и покажет только остальные. Парсер:`, `The app leaves out ${skipped.length} of ${cards.length} cards with problems and shows only the rest. The parser says:`) }}
        <code v-for="warning in skipped" :key="warning">{{ warning }}</code>
      </span>
    </div>
    <ol v-if="cards.length" class="bcard-list">
      <li v-for="(card, index) in cards" :key="index" class="bcard" :data-open="open.includes(index) ? '' : undefined" :data-path="`cards.${index}`">
        <div class="bcard-head">
          <button type="button" class="bcard-toggle" :aria-expanded="open.includes(index)" :aria-controls="`bcard-${index}`" @click="toggle(index)">
            <span class="bcard-type" :data-type="card.type">{{ typeText[String(card.type)]?.[language === 'ru' ? 0 : 1] ?? card.type }}</span>
            <code>{{ card.id }}</code>
            <span class="bcard-title">{{ title(card) }}</span>
            <span v-if="skippedText(card, index)" class="bskip" :title="skippedText(card, index)">{{ t('Пропускается', 'Skipped') }}</span>
            <span v-if="cardIssues(index)" class="bbadge is-bad">{{ cardIssues(index) }}</span>
            <svg class="bchev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
          </button>
          <button type="button" class="bicon" :disabled="index === 0" :aria-label="t('Карточку выше', 'Move card up')" @click="move(index, -1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4" /></svg></button>
          <button type="button" class="bicon" :disabled="index === cards.length - 1" :aria-label="t('Карточку ниже', 'Move card down')" @click="move(index, 1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg></button>
          <button type="button" class="bicon" :aria-label="t('Удалить карточку', 'Remove card')" @click="remove(index)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 4.5h9m-7 0V3h5v1.5m-6 0 .5 8.5h6l.5-8.5" /></svg></button>
        </div>
        <div :id="`bcard-${index}`" class="bfold" :inert="!open.includes(index)"><div class="bfold-in">
          <div class="bgrid bcard-body">
            <div class="bf" :data-path="`cards.${index}.type`">
              <div class="bf-head"><label :for="fieldId(`cards.${index}.type`)">{{ entryFor('cards.type')?.label[language] }}</label><code class="bf-key">type</code></div>
              <select :id="fieldId(`cards.${index}.type`)" class="input bf-select" :value="card.type" @change="retype(index, $event)">
                <option v-for="type in types" :key="type" :value="type">{{ typeText[type]?.[language === 'ru' ? 0 : 1] ?? type }} · {{ type }}</option>
              </select>
            </div>
            <BuilderField :path="`cards.${index}.id`" />
            <BuilderNode :path="`cards.${index}`" :skip="['type', 'id', 'items']" flat />
            <fieldset v-if="card.type === 'actions'" class="bgroup is-wide" :data-path="`cards.${index}.items`">
              <legend class="bgroup-head"><span>{{ entryFor('cards.items')?.label[language] }}</span><code class="bf-key">items</code></legend>
              <p class="bf-help bgroup-help">{{ entryFor('cards.items')?.help?.[language] }}</p>
              <ol class="bitems">
                <li v-for="(_, at) in items(index)" :key="at" class="bitem" :data-path="`cards.${index}.items.${at}`">
                  <div class="bitem-bar">
                    <b>{{ at + 1 }}</b>
                    <button type="button" class="bicon" :disabled="at === 0" :aria-label="t('Выше', 'Move up')" @click="moveItem(index, at, -1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4" /></svg></button>
                    <button type="button" class="bicon" :disabled="at === items(index).length - 1" :aria-label="t('Ниже', 'Move down')" @click="moveItem(index, at, 1)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg></button>
                    <button type="button" class="bicon" :aria-label="t('Удалить кнопку', 'Remove item')" @click="removeItem(index, at)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" /></svg></button>
                  </div>
                  <BuilderNode :path="`cards.${index}.items.${at}`" flat />
                </li>
              </ol>
              <button v-if="items(index).length < (itemsNode(index)?.maxItems ?? 6)" type="button" class="blink" @click="addItem(index)">+ {{ t('Кнопка', 'Item') }}</button>
              <p v-for="(issue, at) in issuesAt(`cards.${index}.items`).map(item => issueText(item, language))" :key="at" class="bf-err" role="alert">{{ issue }}</p>
            </fieldset>
          </div>
        </div></div>
      </li>
    </ol>
    <div class="badd">
      <span>{{ t('Добавить', 'Add') }}</span>
      <button v-for="type in types" :key="type" type="button" class="bchip" :disabled="cards.length >= max" @click="add(type)">+ {{ typeText[type]?.[language === 'ru' ? 0 : 1] ?? type }}</button>
    </div>
    <p v-for="(issue, index) in listIssues" :key="index" class="bf-err" role="alert">{{ issue }}</p>
  </div>
</template>
