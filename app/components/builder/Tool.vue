<script setup lang="ts">
import { docPath } from '~~/shared/docs/catalogue'
import { formSections } from '~~/shared/provider/builder/form'
import { DraftHistory } from '~~/shared/provider/builder/history'
import { mergeStarter, starters } from '~~/shared/provider/builder/workbench'
import { cloneValue, decodeFragment, emitManifest, isBuilderFragment, encodeFragment, type Fragment, type Imported, type Manifest } from '~~/shared/provider/builder/document'
import { validateManifest, type Issue } from '~~/shared/provider/builder/validate'
import type { KernelResult, KernelView, ReclashKernel } from '~/composables/useBuilder'

const emit = defineEmits<{ ready: [] }>()
const { language, t } = useText()
const route = useRoute()
const router = useRouter()

const manifest = reactive<Manifest>({})
const routing = ref('')
const url = ref('')
const issueList = computed(() => validateManifest(manifest))
const issues = computed(() => {
  const map = new Map<string, Issue[]>()
  for (const issue of issueList.value) map.set(issue.path, [...map.get(issue.path) ?? [], issue])
  return map
})
const reveal = ref<{ path: string, at: number }>()
const expansion = ref<{ open: boolean, at: number }>()
const kernel = ref<KernelView>({ state: 'idle' })
const warnings = computed(() => kernel.value.state === 'done' ? kernel.value.result.warnings : [])
provide(builderKey, { manifest, issues, reveal, expansion, warnings })

const sections = formSections.filter(section => section.key !== 'version')
const yaml = computed(() => emitManifest(manifest, routing.value))
const preview = ref<{ highlight: (path: string | null) => void }>()
const form = ref<HTMLElement>()
const workspace = ref<{ focus: () => void }>()
const empty = computed(() => yaml.value.trim() === 'version: 1')

function replace(next: Manifest) {
  const copy = cloneValue(next)
  for (const key of Object.keys(manifest)) delete manifest[key]
  Object.assign(manifest, copy)
}

const snapshot = (): Fragment => ({ manifest: toRaw(manifest), routing: routing.value, url: url.value })
let history: DraftHistory | undefined
const historyRevision = ref(0)
const canUndo = computed(() => { void historyRevision.value; return history?.canUndo ?? false })
const canRedo = computed(() => { void historyRevision.value; return history?.canRedo ?? false })
function editGroup() {
  const active = document.activeElement
  return active instanceof HTMLElement && active.matches('input, textarea') && form.value?.contains(active) ? `${pathOf(active)}:${active.id}` : ''
}
watch([manifest, routing, url], () => {
  if (!history) return
  history.record(snapshot(), editGroup())
  historyRevision.value++
}, { deep: true, flush: 'post' })
function changeHistory(direction: 'undo' | 'redo') {
  if (!history) return
  history.record(snapshot(), editGroup())
  const state = history[direction]()
  if (!state) return
  replace(state.manifest)
  routing.value = state.routing
  url.value = state.url
  confirmReset.value = false
  imported.value = undefined
  historyRevision.value++
  notify(direction === 'undo' ? t('Изменение отменено', 'Change undone') : t('Изменение возвращено', 'Change redone'))
}
function applyStarter(key: string) {
  const starter = starters.find(starter => starter.key === key)
  if (!starter) return
  const next = mergeStarter(toRaw(manifest), starter.value(language.value))
  if (!next.added.length) { notify(t('Поля заготовки уже заданы — ничего не изменено', 'Template fields are already set; nothing changed')); return }
  replace(next.manifest)
  notify(t('Заготовка добавлена; ваши значения сохранены', 'Template added; your values were kept'))
}
function shortcuts(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || document.querySelector('dialog:modal')) return
  if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]')) return
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    workspace.value?.focus()
  } else if ((event.ctrlKey || event.metaKey) && !event.altKey) {
    const key = event.key.toLowerCase()
    const direction = key === 'z' ? (event.shiftKey ? 'redo' : 'undo') : key === 'y' ? 'redo' : undefined
    if (direction && (direction === 'undo' ? canUndo.value : canRedo.value)) { event.preventDefault(); changeHistory(direction) }
  }
}

/* Kernel: the app's parser, loaded on the first edit, import or restored draft, then run on a short debounce. */
let parser: ReclashKernel | null | undefined
let parseTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
function parse() {
  if (!parser || disposed) return
  try {
    const result = JSON.parse(parser.parse(yaml.value, language.value)) as KernelResult
    kernel.value = { state: 'done', result: { ok: !!result.ok, warnings: Array.isArray(result.warnings) ? result.warnings.map(String) : [] }, stale: false }
  } catch {
    kernel.value = { state: 'unavailable' }
  }
}
async function startKernel() {
  if (disposed || !['idle', 'unavailable'].includes(kernel.value.state)) return
  kernel.value = { state: 'loading' }
  const loaded = await loadKernel()
  if (disposed) return
  parser = loaded
  if (parser) parse()
  else kernel.value = { state: 'unavailable' }
}
watch(yaml, startKernel)
watch([yaml, language], () => {
  if (kernel.value.state === 'done') kernel.value = { ...kernel.value, stale: true }
  clearTimeout(parseTimer)
  parseTimer = setTimeout(parse, 300)
})

/* State in the URL fragment, written only after an edit so a plain visit keeps a clean address. */
let restoring = true
let saveTimer: ReturnType<typeof setTimeout> | undefined
let saveRevision = 0
const linkProblem = ref(false)
const saveProblem = ref(false)
const saved = ref<'idle' | 'saving' | 'saved' | 'failed'>('idle')
async function save(): Promise<boolean> {
  clearTimeout(saveTimer)
  const revision = ++saveRevision
  const state = { manifest: toRaw(manifest), routing: routing.value, url: url.value }
  const empty = !Object.keys(state.manifest).length && !state.routing && !state.url
  try {
    const hash = empty ? '' : `#${await encodeFragment(state)}`
    if (disposed || revision !== saveRevision) return false
    if (hash !== route.hash) await router.replace({ path: route.path, query: route.query, hash })
    if (disposed || revision !== saveRevision) return false
    saveProblem.value = false
    saved.value = empty ? 'idle' : 'saved'
    linkProblem.value = false
    return true
  } catch {
    if (!disposed && revision === saveRevision) { saveProblem.value = true; saved.value = 'failed' }
    return false
  }
}
watch([manifest, routing, url], () => {
  if (restoring) return
  saved.value = 'saving'
  saveRevision++
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { void save() }, 400)
}, { deep: true, flush: 'sync' })
async function restore() {
  if (!isBuilderFragment(location.hash)) return
  try {
    const state = await decodeFragment(location.hash)
    if (!state || disposed) return
    replace(state.manifest)
    routing.value = state.routing
    url.value = state.url
    saved.value = 'saved'
  } catch {
    if (!disposed) linkProblem.value = true
  }
}

function load(result: Imported) {
  replace(result.manifest)
  routing.value = result.routing
  importOpen.value = false
  imported.value = { dropped: result.dropped, routing: !!result.routing }
  notify(t('Файл загружен; импорт можно отменить', 'File loaded; the import can be undone'))
}
const importOpen = ref(false)
const imported = ref<{ dropped: string[], routing: boolean }>()
const confirmReset = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined
function reset() {
  if (!confirmReset.value) {
    confirmReset.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => { confirmReset.value = false }, 3500)
    return
  }
  confirmReset.value = false
  imported.value = undefined
  replace({})
  routing.value = ''
  url.value = ''
  save()
}
const copied = ref<'idle' | 'done' | 'failed'>('idle')
const copying = ref(false)
const toast = ref<{ text: string, bad: boolean, at: number }>()
let copyTimer: ReturnType<typeof setTimeout> | undefined
function notify(text: string, bad = false) {
  toast.value = { text, bad, at: Date.now() }
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = 'idle'; toast.value = undefined }, 2200)
}
async function copyLink() {
  if (copying.value) return
  copying.value = true
  let done = false
  try {
    if (await save()) {
      await navigator.clipboard.writeText(location.href)
      done = true
    }
  } catch {
    done = false
  } finally {
    copying.value = false
  }
  if (disposed) return
  copied.value = done ? 'done' : 'failed'
  notify(done ? t('Ссылка на черновик скопирована', 'Draft link copied') : t('Не удалось скопировать ссылку', 'Could not copy the link'), !done)
}

/* Form <-> preview: a focused or hovered field is outlined in the preview; a click there finds the field. */
const pathOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>('[data-path]')?.dataset.path : undefined) ?? null
let hovered: string | null = null
let focused: string | null = null
function onFocus(event: FocusEvent) { focused = pathOf(event.target); preview.value?.highlight(focused) }
function onBlur(event: FocusEvent) {
  if (form.value?.contains(event.relatedTarget as Node | null)) return
  focused = null
  preview.value?.highlight(hovered)
}
function onHover(event: MouseEvent) {
  const path = pathOf(event.target)
  if (path === hovered) return
  hovered = path
  preview.value?.highlight(path ?? focused)
}
function onLeave() { hovered = null; preview.value?.highlight(focused) }

function find(path: string): HTMLElement | null {
  const parts = path.split('.')
  while (parts.length) {
    const element = form.value?.querySelector<HTMLElement>(`[data-path="${CSS.escape(parts.join('.'))}"]`)
    if (element) return element
    parts.pop()
  }
  return null
}
function select(path: string) {
  reveal.value = { path, at: Date.now() }
  nextTick(() => {
    const element = find(path)
    if (!element) return
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
    const direct = document.getElementById(fieldId(path))
    const scope = element.classList.contains('bsec') ? element.querySelector('.bsec-body') ?? element : element
    const available = (selector: string) => [...scope.querySelectorAll<HTMLElement>(selector)].find(control => !control.closest('[inert]'))
    const control = direct && form.value?.contains(direct) && !direct.closest('[inert]') ? direct : available('input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled)') ?? available('button:not(:disabled)')
    control?.focus({ preventScroll: true })
    element.classList.remove('is-picked')
    void element.offsetWidth
    element.classList.add('is-picked')
  })
}
function goTo(key: string) {
  if (key !== 'output') reveal.value = { path: key, at: Date.now() }
  nextTick(() => document.getElementById(`b-${key}`)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }))
}

/* The strip marks the section under the toolbar and keeps its chip in view. */
const strip = ref<HTMLElement>()
const current = ref('')
let spy: IntersectionObserver | undefined
const visible = new Set<string>()
function spyOn() {
  spy = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const key = entry.target.id.slice(2)
      if (entry.isIntersecting) visible.add(key)
      else visible.delete(key)
    }
    current.value = chips.value.find(chip => visible.has(chip.key))?.key ?? current.value
  }, { rootMargin: '-160px 0px -55% 0px' })
  for (const chip of chips.value) {
    const element = document.getElementById(`b-${chip.key}`)
    if (element) spy.observe(element)
  }
}
watch(current, key => nextTick(() => {
  const chip = strip.value?.querySelector<HTMLElement>(`[data-key="${key}"]`)
  const bar = strip.value
  if (!chip || !bar) return
  const left = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2
  bar.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}))
const issueCount = (key: string) => issueList.value.filter(issue => issue.path === key || issue.path.startsWith(`${key}.`)).length
const filled = (key: string) => manifest[key] !== undefined
const chips = computed(() => [
  ...sections.map(section => ({ key: section.key, text: section.title[language.value] })),
  { key: 'routing', text: t('Автомаршрутизация', 'Auto-routing') },
  { key: 'output', text: 'reclash.yaml' },
])

onMounted(async () => {
  await restore()
  if (disposed) return
  await nextTick()
  if (disposed) return
  restoring = false
  history = new DraftHistory(snapshot())
  historyRevision.value++
  window.addEventListener('keydown', shortcuts)
  spyOn()
  emit('ready')
})
onBeforeUnmount(() => {
  disposed = true
  saveRevision++
  spy?.disconnect()
  window.removeEventListener('keydown', shortcuts)
  for (const timer of [parseTimer, saveTimer, resetTimer, copyTimer]) clearTimeout(timer)
})
</script>

<template>
  <div class="bwrap wrap">
    <div class="blayout">
      <div ref="form" class="bmain" @focusin="onFocus" @focusout="onBlur" @mouseover="onHover" @mouseleave="onLeave">
        <div class="btool">
          <nav ref="strip" class="bstrip" :aria-label="t('Разделы манифеста', 'Manifest sections')">
            <button
              v-for="chip in chips" :key="chip.key" type="button" class="bstrip-i" :class="{ 'is-out': chip.key === 'output' }" :data-key="chip.key"
              :data-filled="filled(chip.key) ? '' : undefined" :aria-current="current === chip.key ? 'location' : undefined" @click="goTo(chip.key)"
            >
              {{ chip.text }}<i v-if="issueCount(chip.key)" class="bstrip-bad" :aria-label="t('есть ошибки', 'has problems')" />
            </button>
          </nav>
          <div class="btop-actions">
            <div class="bhistory" role="group" :aria-label="t('История изменений', 'Edit history')">
              <button type="button" class="bicon" :disabled="!canUndo" :aria-label="t('Отменить изменение', 'Undo change')" :title="t('Ctrl/⌘+Z вне текстового поля', 'Ctrl/⌘+Z outside text fields')" @click="changeHistory('undo')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5-5 5 5 5M3 10h11a6 6 0 0 1 0 12" /></svg></button>
              <button type="button" class="bicon" :disabled="!canRedo" :aria-label="t('Вернуть изменение', 'Redo change')" :title="t('Ctrl/⌘+Shift+Z вне текстового поля', 'Ctrl/⌘+Shift+Z outside text fields')" @click="changeHistory('redo')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 5 5 5-5 5M21 10H10a6 6 0 0 0 0 12" /></svg></button>
            </div>
            <button type="button" class="btn btn-ghost btn-s" :aria-label="t('Импорт', 'Import')" :aria-expanded="importOpen" aria-controls="bimport" :title="t('Импорт', 'Import')" @click="importOpen = !importOpen">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m-4.5 4.5L12 4l4.5 4.5M5 14v5h14v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <span class="btop-label">{{ t('Импорт', 'Import') }}</span>
            </button>
            <button type="button" class="btn btn-ghost btn-s" :aria-label="t('Ссылка на черновик', 'Draft link')" :class="{ 'is-done': copied === 'done' }" :disabled="copying" :title="t('Ссылка на черновик', 'Draft link')" @click="copyLink">
              <svg v-if="copied === 'done'" class="bok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
              <span class="btop-label">{{ t('Ссылка на черновик', 'Draft link') }}</span>
            </button>
            <button type="button" class="btn btn-ghost btn-s bdanger" :class="{ 'is-armed': confirmReset }" @click="reset">
              {{ confirmReset ? t('Точно очистить?', 'Clear everything?') : t('Сбросить', 'Reset') }}
            </button>
            <button type="button" class="btn btn-primary btn-s" :disabled="empty" :aria-label="t('Перейти к экспорту YAML', 'Go to YAML export')" @click="goTo('output')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m-5-5 5 5 5-5M5 19h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg><span class="btop-label">YAML</span></button>
          </div>
        </div>

        <p v-if="linkProblem" class="bf-err" role="alert">{{ t('Ссылка повреждена, слишком велика или из другой версии конструктора — форма открыта пустой.', 'The link is damaged, too large or from another builder version; the form opened empty.') }}</p>
        <p v-if="saveProblem" class="bf-err" role="alert">{{ t('Не удалось сохранить черновик в адресе страницы. Уменьшите его размер или скачайте YAML — данные в форме не потеряны.', 'Could not save the draft in the page address. Reduce its size or download the YAML; the form data is unchanged.') }}</p>

        <BuilderWorkspace ref="workspace" :saved="saved" @starter="applyStarter" @select="select" @expand="expansion = { open: $event, at: Date.now() }" />
        <div v-if="imported" class="note bimport-result" role="status" data-test="imported">
          <span>
            {{ t('Файл загружен. Импорт можно отменить.', 'File loaded. The import can be undone.') }}
            <template v-if="imported.routing">{{ t(' Routing сохранён как есть.', ' Routing is kept as written.') }}</template>
            <template v-if="imported.dropped.length">{{ t(' Неизвестные ключи отброшены:', ' Unknown keys were dropped:') }} <code v-for="key in imported.dropped" :key="key" class="bdropped">{{ key }}</code></template>
          </span>
          <button type="button" class="bicon" :aria-label="t('Закрыть результат импорта', 'Dismiss the import result')" @click="imported = undefined"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7" /></svg></button>
        </div>
        <div id="bimport" class="bfold bimport-fold" :data-open="importOpen ? '' : undefined" :inert="!importOpen"><div class="bfold-in"><div class="bimport-card"><BuilderImport @imported="load" /></div></div></div>

        <div class="bsecs">
          <BuilderSection v-for="section in sections" :key="section.key" :section="section" />
          <section id="b-routing" class="bsec is-static">
            <h3 class="bsec-h"><span class="bsec-toggle">
              <span class="bsec-title">{{ t('Автомаршрутизация', 'Auto-routing') }}</span><code class="bf-key">routing</code>
              <span class="bsec-sum">{{ t('Вне конструктора', 'Outside the builder') }}</span>
            </span></h3>
            <div class="bsec-body">
              <p class="bf-help">
                {{ t('Профили и сценарии здесь не собираются: у них свой синтаксис и проверка (rcx lint).', 'Profiles and scenarios are not built here: they have their own syntax and check (rcx lint).') }}
                <SiteLink class="tlink" :to="docPath(language, 'rcx')">{{ t('Автомаршрутизация', 'Auto-routing') }}</SiteLink>
              </p>
              <template v-if="routing">
                <CodeBlock :code="routing" lang="yaml" :label="t('Из импортированного файла, без изменений', 'From the imported file, unchanged')" />
                <button type="button" class="blink" @click="routing = ''">{{ t('Убрать routing из файла', 'Remove routing from the file') }}</button>
              </template>
              <p v-else class="bf-help">{{ t('Импортируйте файл с routing — раздел попадёт в вывод как есть.', 'Import a file with routing and the section goes to the output as written.') }}</p>
            </div>
          </section>
        </div>

        <BuilderOutput id="b-output" v-model:url="url" :yaml="yaml" :kernel="kernel" :routing="!!routing" @retry="startKernel" />
      </div>
      <BuilderPreview ref="preview" :yaml="yaml" :kernel="kernel" @select="select" />
    </div>
    <div class="btoasts" aria-live="polite">
      <p v-if="toast" :key="toast.at" class="btoast" :class="{ 'is-bad': toast.bad }">{{ toast.text }}</p>
    </div>
  </div>
</template>
