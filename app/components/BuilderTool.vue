<script setup lang="ts">
import { builderDefaults, builderSchema, builderFields, builderEmitters, headerPairs, type BuilderField } from '~~/shared/provider/builder'
import { brandBand } from '~~/shared/provider/theme'
import { subscriptionTypeText } from '~~/shared/provider/standard'
const { language, t } = useText()
const motion = usePageMotion()
const route = useRoute(), router = useRouter()
const state = reactive(builderDefaults())
const open = reactive<Record<string, boolean>>(Object.fromEntries(builderSchema.map(section => [section.id, !!section.open])))
const tab = ref<keyof typeof builderEmitters>('headers')
const copyLabel = ref(''), shareLabel = ref('')
const tabs = useTemplateRef<HTMLElement>('tabs')
const output = computed(() => headerPairs(state).map(([key, value]) => builderEmitters[tab.value].line(key, value)))
const outputText = computed(() => output.value.map(line => line.before + line.key + line.after).join('\n'))
const name = computed(() => String(state.name).trim() || 'ReClash')
const subscriptionType = computed(() => subscriptionTypeText(String(state.subscriptionType)))
// The brand colour recolours only the preview card, never the site.
const previewTheme = computed(() => {
  const band = brandBand(state.hex)
  return band ? { '--bl': band.l.toFixed(4), '--bc': band.c.toFixed(4), '--bh': band.h.toFixed(2) } : {}
})
const used = computed(() => Number(state.used) || 0), total = computed(() => Number(state.total) || 0)
let hashTimer: ReturnType<typeof setTimeout> | undefined
let tabsMagnet: { select: (element: Element | null) => void } | undefined
const sectionSprings = new Map<string, ReturnType<NonNullable<typeof motion.value>['M']['spring']>>()
const error = (field: BuilderField) => state[field.key] ? field.validate?.(String(state[field.key]))?.[language.value] : null
function rows(fields: BuilderField[]): Array<BuilderField | BuilderField[]> {
  const result: Array<BuilderField | BuilderField[]> = []
  let group: BuilderField[] | undefined
  for (const field of fields) {
    if (field.row) {
      if (!group || group[0]?.row !== field.row) { group = []; result.push(group) }
      group.push(field)
    } else { group = undefined; result.push(field) }
  }
  return result
}
function update(field: BuilderField, event: Event, color = false) {
  const input = event.target as HTMLInputElement
  state[field.key] = color ? input.value.slice(1).toUpperCase() : field.type === 'number' ? Math.max(0, Number(input.value) || 0) : input.value
  clearTimeout(hashTimer)
  hashTimer = setTimeout(saveHash, 300)
}
function saveHash() {
  return router.replace({ path: route.path, query: route.query, hash: '#' + btoa(unescape(encodeURIComponent(JSON.stringify(state)))) })
}
function restoreHash() {
  try {
    const saved = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))))
    for (const field of builderFields) if (typeof saved[field.key] === 'string' || typeof saved[field.key] === 'number') state[field.key] = saved[field.key]
  } catch { /* Empty and unrelated fragments retain the draft defaults. */ }
}
function toggle(id: string, event: Event) {
  const section = (event.currentTarget as HTMLElement).closest('.b-sec')!
  const body = section.querySelector<HTMLElement>('.b-body')!
  const full = body.querySelector('.b-fields')!.getBoundingClientRect().height
  let spring = sectionSprings.get(id)
  if (!spring && motion.value) {
    spring = motion.value.M.spring(open[id] ? 1 : 0, { preset: 'smooth', precision: 0.002 })
    sectionSprings.set(id, spring)
  }
  open[id] = !open[id]
  if (spring) {
    const animation = spring
    if (!open[id]) animation.set(1)
    spring.onUpdate = (value: number) => { body.style.height = value >= 1 && animation.target === 1 ? 'auto' : Math.max(0, value * full) + 'px' }
    spring.to(open[id] ? 1 : 0)
  }
}
function select(next: typeof tab.value, event: Event) { tab.value = next; tabsMagnet?.select(event.currentTarget as Element) }
async function copy(share: boolean, event: Event) {
  const runtime = motion.value
  if (!runtime) return
  if (share) await saveHash()
  const button = event.currentTarget as HTMLElement
  const text = share ? location.href : outputText.value
  const ok = await runtime.helpers.copyText(text)
  if (runtime.scope.disposed) return
  runtime.helpers.morphWidth(button, () => {
    if (share) shareLabel.value = ok ? t('Ссылка скопирована', 'Link copied') : t('Не удалось скопировать', 'Could not copy')
    else copyLabel.value = ok ? t('Скопировано', 'Copied') : t('Не удалось скопировать', 'Could not copy')
  })
  runtime.scope.timeout(() => { shareLabel.value = ''; copyLabel.value = '' }, 2000)
}
watch(motion, runtime => {
  if (!runtime || !tabs.value) return
  tabsMagnet = runtime.M.magnetGroup(tabs.value, { items: 'button', sticky: true, contentPull: 0 })
  runtime.scope.frame(() => tabsMagnet?.select(tabs.value!.querySelector('[aria-pressed="true"]')))
})
onMounted(restoreHash)
onBeforeUnmount(() => clearTimeout(hashTimer))
</script>

<template>
  <div class="b-grid">
    <form id="b-form" class="b-form" :aria-label="t('Параметры заголовков', 'Header settings')" @submit.prevent>
      <section v-for="section in builderSchema" :key="section.id" class="b-sec" :data-open="open[section.id] ? '' : undefined">
        <button type="button" :aria-expanded="open[section.id]" :aria-controls="`b-${section.id}`" @click="toggle(section.id, $event)">
          <b>{{ section.title[language] }}</b><span class="h">{{ section.fields.map(field => field.header).filter(Boolean).join(' · ') }}</span>
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <div :id="`b-${section.id}`" class="b-body"><div class="b-fields">
          <p v-if="section.note" class="hint">{{ section.note[language] }}</p>
          <template v-for="(row, index) in rows(section.fields)" :key="index">
            <div v-if="Array.isArray(row)" class="b-row"><BuilderField v-for="field in row" :key="field.key" :field="field" :value="state[field.key]" :error="error(field)" @update="(event, color) => update(field, event, color)" /></div>
            <BuilderField v-else :field="row" :value="state[row.key]" :error="error(row)" @update="(event, color) => update(row, event, color)" />
          </template>
        </div></div>
      </section>
    </form>
    <aside class="b-aside" :aria-label="t('Результат', 'Result')">
      <div id="b-card" class="subcard theme-scope" :style="previewTheme">
        <div class="sc-head"><span class="sc-logo" aria-hidden="true">{{ Array.from(name)[0]?.toUpperCase() }}</span><div style="min-width:0"><div class="sc-name">{{ name }}</div><span v-if="subscriptionType" class="tag" data-subscription-type>{{ subscriptionType[language] }}</span><div class="sc-sub">{{ t('Превью карточки подписки', 'Subscription card preview') }}</div></div></div>
        <div class="sc-ann" :hidden="!String(state.announce).trim()"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3.2v4.1m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg><span>{{ String(state.announce).trim() }}</span></div>
        <div class="sc-traffic"><div class="sc-row"><span>{{ t('Трафик', 'Traffic') }}</span><b>{{ total ? `${used} / ${total} ${t('ГБ', 'GB')}` : `${used} ${t('ГБ · без лимита', 'GB · unlimited')}` }}</b></div><div class="sc-bar"><i :style="{ width: total ? `${Math.min(100, used / total * 100)}%` : '0%' }" /></div></div>
        <div class="sc-btn" :hidden="!String(state.buy).trim()">{{ t('Продлить', 'Renew') }}</div>
      </div>
      <div id="b-tabs" ref="tabs" class="b-tabs" role="group" :aria-label="t('Формат вывода', 'Output format')">
        <button v-for="(emitter, key) in builderEmitters" :key="key" type="button" :data-tab="key" :aria-pressed="tab === key" @click="select(key, $event)">{{ emitter.label[language] }}</button>
      </div>
      <pre id="b-code" class="b-code" aria-live="polite"><CodeLines v-if="output.length" :code="outputText" :lang="tab === 'nginx' ? 'nginx' : 'http'" /><span v-else style="color:var(--fg-3)">{{ t('Заполните поля слева', 'Fill in the fields on the left') }}</span></pre>
      <div class="b-actions">
        <button id="b-copy" class="btn btn-primary btn-s copy-btn" :class="{ 'is-done': copyLabel }" type="button" @click="copy(false, $event)">
          <svg class="ico-m cp" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v10H9zM5 15V5h10" /></svg>
          <svg class="ico-m ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <span class="btn-label">{{ copyLabel || t('Скопировать', 'Copy') }}</span>
        </button>
        <button id="b-share" class="btn btn-ghost btn-s copy-btn" :class="{ 'is-done': shareLabel }" type="button" @click="copy(true, $event)">
          <svg class="ico-m cp" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
          <svg class="ico-m ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <span class="btn-label">{{ shareLabel || t('Ссылка на эту форму', 'Link to this form') }}</span>
        </button>
      </div>
    </aside>
  </div>
</template>
