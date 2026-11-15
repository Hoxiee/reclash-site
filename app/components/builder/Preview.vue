<script setup lang="ts">
import type { KernelView } from '~/composables/useBuilder'
// Host side of the preview protocol v1: the app's own widgets, built for the web, in a same-origin iframe.
// The build weighs megabytes and few visitors want it, so nothing is requested before an explicit open.
const props = defineProps<{ yaml: string, kernel: KernelView }>()
const emit = defineEmits<{ select: [path: string] }>()
const { language, t } = useText()

type Screen = 'home' | 'widgets' | 'import'
type Platform = 'android' | 'windows' | 'macos' | 'linux'
type Status = 'idle' | 'checking' | 'loading' | 'ready' | 'missing' | 'failed'
const checkTimeout = 8000
const loadTimeout = 30_000
// The directory URL: Pages answers `index.html` with a redirect, which would load the document twice.
const source = '/runtime/preview/'
// Logical viewports the app lays out in, and the bezel drawn around each, in the same units.
const frames = { phone: { size: [390, 844], bezel: 12 }, wide: { size: [1280, 800], bezel: 10 } } as const

const status = ref<Status>('idle')
const screen = ref<Screen>('home')
const connected = ref(true)
const usedGb = ref(12)
const totalGb = ref(100)
const daysLeft = ref(21)
const expires = ref(true)
const platform = ref<Platform>('android')
const theme = ref<'light' | 'dark'>('dark')
const locale = ref<'ru' | 'en'>(language.value)
const frame = ref<keyof typeof frames>('phone')
const inspect = ref(false)
const narrow = ref(false)
const open = ref(false)
const opened = ref<{ kind: string, value: string }>()

const stage = ref<HTMLElement>()
const dialog = ref<HTMLDialogElement>()
const iframe = ref<HTMLIFrameElement>()
const toggle = ref<HTMLButtonElement>()
const close = ref<HTMLButtonElement>()
const room = ref({ width: 0, height: 0 })
const device = computed(() => {
  const { size, bezel } = frames[frame.value]
  return { screen: size, bezel, outer: [size[0] + bezel * 2, size[1] + bezel * 2] as const }
})
const scale = computed(() => Math.min(1, room.value.width / device.value.outer[0], room.value.height / device.value.outer[1]) || 0)
const box = computed(() => ({ width: `${Math.floor(device.value.outer[0] * scale.value)}px`, height: `${Math.floor(device.value.outer[1] * scale.value)}px`, '--k': scale.value, '--bz': `${device.value.bezel * scale.value}px` }))

const scenario = computed(() => ({
  screen: screen.value,
  locale: locale.value,
  theme: theme.value,
  platform: platform.value,
  connected: connected.value,
  usedGb: Math.max(0, Number(usedGb.value) || 0),
  totalGb: Math.max(0, Number(totalGb.value) || 0),
  daysLeft: expires.value ? Math.max(0, Math.round(Number(daysLeft.value) || 0)) : null,
}))

const verdict = computed(() => props.kernel.state === 'done' && !props.kernel.stale ? props.kernel.result : undefined)

function post(message: Record<string, unknown>) {
  if (status.value !== 'ready') return
  iframe.value?.contentWindow?.postMessage({ v: 1, ...message }, location.origin)
}
let manifestTimer: ReturnType<typeof setTimeout> | undefined
let chipTimer: ReturnType<typeof setTimeout> | undefined
let loadTimer: ReturnType<typeof setTimeout> | undefined
let check: AbortController | undefined
let disposed = false
let highlighted: string | null = null
watch(() => props.yaml, () => {
  clearTimeout(manifestTimer)
  manifestTimer = setTimeout(() => post({ type: 'manifest', yaml: props.yaml }), 250)
})
let feedback: typeof scenario.value | undefined
watch(scenario, next => {
  if (next !== feedback) post({ type: 'scenario', scenario: next })
  feedback = undefined
}, { deep: true })
watch(inspect, enabled => post({ type: 'inspect', enabled }))

function onMessage(event: MessageEvent) {
  if (event.origin !== location.origin || !iframe.value || event.source !== iframe.value.contentWindow) return
  const data = event.data as { v?: number, type?: string, path?: unknown, kind?: unknown, value?: unknown, connected?: unknown }
  if (!data || data.v !== 1) return
  if (data.type === 'ready' && status.value === 'loading') {
    clearTimeout(loadTimer)
    status.value = 'ready'
    clearTimeout(manifestTimer)
    post({ type: 'manifest', yaml: props.yaml })
    post({ type: 'scenario', scenario: scenario.value })
    if (inspect.value) post({ type: 'inspect', enabled: true })
    if (highlighted) post({ type: 'highlight', path: highlighted })
  } else if (data.type === 'select' && typeof data.path === 'string') {
    if (narrow.value) setOpen(false)
    emit('select', data.path)
  } else if (data.type === 'open' && typeof data.kind === 'string') {
    opened.value = { kind: data.kind, value: String(data.value ?? '') }
    clearTimeout(chipTimer)
    chipTimer = setTimeout(() => { opened.value = undefined }, 6000)
  } else if (data.type === 'connected' && typeof data.connected === 'boolean' && data.connected !== connected.value) {
    connected.value = data.connected
    feedback = scenario.value
  }
}

function failed() {
  clearTimeout(loadTimer)
  if (!disposed) status.value = 'failed'
}
async function load() {
  if (!['idle', 'missing', 'failed'].includes(status.value)) return
  status.value = 'checking'
  opened.value = undefined
  const controller = new AbortController()
  check = controller
  const timeout = setTimeout(() => controller.abort(), checkTimeout)
  try {
    const response = await fetch(source, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
    await response.arrayBuffer()
    if (disposed) return
    if (!response.ok) {
      status.value = response.status === 404 || response.status === 410 ? 'missing' : 'failed'
      return
    }
    if (!(response.headers.get('content-type') ?? '').includes('text/html')) {
      status.value = 'missing'
      return
    }
    loadTimer = setTimeout(failed, loadTimeout)
    status.value = 'loading'
  } catch {
    failed()
  } finally {
    clearTimeout(timeout)
    if (check === controller) check = undefined
  }
}

function highlight(path: string | null) {
  highlighted = path
  post({ type: 'highlight', path })
}
defineExpose({ highlight })

const openText = computed(() => {
  const chip = opened.value
  if (!chip) return ''
  const text: Record<string, [string, string]> = {
    url: ['открывает', 'opens'], copy: ['копирует', 'copies'], share: ['делится', 'shares'], app: ['действие приложения', 'app action'],
  }
  return `${text[chip.kind]?.[language.value === 'ru' ? 0 : 1] ?? chip.kind} ${chip.value}`
})

let resize: ResizeObserver | undefined
let query: MediaQueryList | undefined
const measure = () => {
  room.value = { width: stage.value?.clientWidth ?? 0, height: stage.value?.clientHeight ?? 0 }
}
// Below the two-column width the preview is a full-screen layer over a locked page.
function lockPage(locked: boolean) {
  document.documentElement.classList.toggle('bprev-locked', locked)
}
function syncDialog() {
  const element = dialog.value
  if (!element) return
  if (narrow.value) {
    if (!open.value) element.close()
    else if (!element.matches(':modal')) { element.close(); element.showModal() }
  } else {
    if (element.matches(':modal')) element.close()
    element.open = true
  }
}
function setOpen(next: boolean) {
  open.value = next
  lockPage(next && narrow.value)
  syncDialog()
  if (next) {
    nextTick(() => { measure(); if (narrow.value) close.value?.focus({ preventScroll: true }) })
    void load()
  } else if (narrow.value) {
    toggle.value?.focus({ preventScroll: true })
  }
}
function onQuery() {
  narrow.value = !!query?.matches
  lockPage(open.value && narrow.value)
  syncDialog()
  nextTick(measure)
}
onMounted(() => {
  theme.value = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  query = matchMedia('(max-width: 1023px)')
  narrow.value = query.matches
  syncDialog()
  query.addEventListener('change', onQuery)
  window.addEventListener('message', onMessage)
  resize = new ResizeObserver(measure)
  if (stage.value) resize.observe(stage.value)
  measure()
})
onBeforeUnmount(() => {
  disposed = true
  check?.abort()
  clearTimeout(loadTimer)
  dialog.value?.close()
  query?.removeEventListener('change', onQuery)
  window.removeEventListener('message', onMessage)
  resize?.disconnect()
  lockPage(false)
  clearTimeout(manifestTimer)
  clearTimeout(chipTimer)
})

const screens = computed(() => [
  { key: 'home', text: t('Главная', 'Home') },
  { key: 'widgets', text: t('Виджеты', 'Widgets') },
  { key: 'import', text: t('Импорт', 'Import') },
] as const)
function screenKey(event: KeyboardEvent, key: Screen) {
  const index = screens.value.findIndex(item => item.key === key)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? screens.value.length - 1
    : event.key === 'ArrowRight' ? (index + 1) % screens.value.length
    : event.key === 'ArrowLeft' ? (index + screens.value.length - 1) % screens.value.length : undefined
  if (next === undefined) return
  event.preventDefault()
  screen.value = screens.value[next]!.key
  const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('button')
  buttons?.[next]?.focus()
  void load()
}
const shown = computed(() => !narrow.value || open.value)
</script>

<template>
  <div class="bside">
    <button ref="toggle" type="button" class="bprev-toggle" :aria-expanded="narrow ? open : true" aria-controls="bprev" @click="setOpen(!open)">
      <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5.5" y="2.5" width="9" height="15" rx="2.4" /><path d="M8.8 14.8h2.4" /></svg>
      {{ t('Предпросмотр', 'Preview') }}
    </button>
    <dialog
      id="bprev" ref="dialog" class="bprev" :data-open="shown ? '' : undefined" :data-ready="status === 'ready' ? '' : undefined"
      :role="narrow ? undefined : 'complementary'" :aria-modal="narrow && open ? 'true' : undefined" :aria-label="t('Предпросмотр', 'Preview')" @cancel.prevent="setOpen(false)"
    >
      <div class="bprev-head">
        <h2 class="bprev-title">{{ t('Предпросмотр', 'Preview') }}</h2>
        <div class="bseg bprev-screens" role="tablist" :aria-label="t('Экран', 'Screen')">
          <button v-for="item in screens" :key="item.key" type="button" role="tab" :aria-selected="screen === item.key" :tabindex="screen === item.key ? 0 : -1" @click="screen = item.key; load()" @keydown="screenKey($event, item.key)">{{ item.text }}</button>
        </div>
        <button ref="close" type="button" class="bicon bprev-close" :aria-label="t('Закрыть предпросмотр', 'Close the preview')" @click="setOpen(false)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" /></svg>
        </button>
      </div>

      <div class="bstage" :data-frame="frame">
        <details v-if="verdict && (!verdict.ok || verdict.warnings.length)" class="bprev-warn" :class="{ 'is-bad': !verdict.ok }">
          <summary>
            <i aria-hidden="true" />
            <span v-if="!verdict.ok">{{ t('Приложение отклоняет файл: предпросмотр без манифеста', 'The app rejects the file: the preview runs without it') }}</span>
            <span v-else>{{ t(`Приложение пропускает часть файла: ${verdict.warnings.length}`, `The app skips part of the file: ${verdict.warnings.length}`) }}</span>
          </summary>
          <ul><li v-for="(warning, index) in verdict.warnings" :key="index"><code>{{ warning }}</code></li></ul>
        </details>
        <div ref="stage" class="bstage-room">
          <div class="bdevice-box" :style="box">
            <div class="bdevice" :data-frame="frame" :style="{ width: `${device.outer[0]}px`, height: `${device.outer[1]}px`, transform: `scale(${scale})` }">
              <div class="bscreen" :style="{ width: `${device.screen[0]}px`, height: `${device.screen[1]}px` }">
                <div class="bscreen-skel" :data-busy="status === 'checking' || status === 'loading' ? '' : undefined" aria-hidden="true">
                  <i class="is-orb" /><i class="is-line" /><i class="is-card" /><i class="is-dock" />
                </div>
                <iframe
                  v-if="status === 'loading' || status === 'ready'"
                  ref="iframe" class="bframe" :src="source" :title="t('Предпросмотр ReClash', 'ReClash preview')" sandbox="allow-scripts allow-same-origin"
                  :width="device.screen[0]" :height="device.screen[1]" referrerpolicy="no-referrer" @error="failed"
                />
              </div>
            </div>
            <div class="bscreen-ui">
              <div v-if="status === 'missing'" class="bstage-note" role="status">
                <p><b>{{ t('Предпросмотр не собран в этой копии сайта.', 'The preview is not built into this copy of the site.') }}</b></p>
                <p>{{ t('Форма, проверка и вывод работают без него. Сборка приложения кладёт его в public/runtime/preview/.', 'The form, checks and output work without it. The app build places it in public/runtime/preview/.') }}</p>
                <button type="button" class="btn btn-primary btn-s" @click="load">{{ t('Повторить загрузку', 'Retry loading') }}</button>
              </div>
              <div v-else-if="status === 'failed'" class="bstage-note" role="status">
                <p><b>{{ t('Не удалось загрузить предпросмотр.', 'Could not load the preview.') }}</b></p>
                <p>{{ t('Проверьте соединение и попробуйте ещё раз. Черновик и вывод YAML сохранены.', 'Check your connection and try again. Your draft and YAML output are unchanged.') }}</p>
                <button type="button" class="btn btn-primary btn-s" @click="load">{{ t('Повторить загрузку', 'Retry loading') }}</button>
              </div>
              <div v-else-if="status === 'idle' || status === 'checking'" class="bstage-note">
                <button type="button" class="btn btn-primary btn-s" :disabled="status === 'checking'" @click="load">{{ t('Загрузить предпросмотр', 'Load the preview') }}</button>
                <p>{{ t('Настоящие виджеты ReClash, около 3 МБ. Внешние изображения не загружаются; черновик остаётся на устройстве.', 'The real ReClash widgets, about 3 MB. External images are not loaded; your draft stays on your device.') }}</p>
              </div>
              <div v-else-if="status === 'loading'" class="bstage-load" role="status"><span class="bspin" aria-hidden="true" />{{ t('Загружаем приложение', 'Loading the app') }}</div>
              <div v-if="opened" class="bopen" role="status">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 3h4v4m0-4L7.5 8.5M12 9.5V13H3V4h3.5" /></svg>
                <span class="mono">{{ openText }}</span>
                <button type="button" class="bicon" :aria-label="t('Скрыть', 'Dismiss')" @click="opened = undefined"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7l-7 7" /></svg></button>
              </div>
            </div>
          </div>
        </div>
        <div class="brail" role="group" :aria-label="t('Вид', 'View')">
          <button type="button" class="bicon" :aria-pressed="theme === 'dark'" :title="t('Тёмная тема приложения', 'Dark app theme')" :aria-label="t('Тёмная тема приложения', 'Dark app theme')" @click="theme = theme === 'dark' ? 'light' : 'dark'">
            <svg v-if="theme === 'dark'" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 9.6A5.5 5.5 0 1 1 6.4 3 4.3 4.3 0 0 0 13 9.6z" /></svg>
            <svg v-else viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.8" /><path d="M8 1.8v1.4m0 9.6v1.4M1.8 8h1.4m9.6 0h1.4M3.6 3.6l1 1m6.8 6.8 1 1m0-8.8-1 1m-6.8 6.8-1 1" /></svg>
          </button>
          <button type="button" class="bicon brail-lang" :title="t('Язык приложения', 'App language')" :aria-label="t(`Язык приложения: ${locale.toUpperCase()}`, `App language: ${locale.toUpperCase()}`)" @click="locale = locale === 'ru' ? 'en' : 'ru'">{{ locale.toUpperCase() }}</button>
          <button type="button" class="bicon" :aria-pressed="frame === 'wide'" :title="t('Широкое окно', 'Wide window')" :aria-label="t('Широкое окно', 'Wide window')" @click="frame = frame === 'wide' ? 'phone' : 'wide'">
            <svg v-if="frame === 'wide'" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.8" y="3.2" width="12.4" height="8.4" rx="1.4" /><path d="M5.5 13.8h5" /></svg>
            <svg v-else viewBox="0 0 16 16" aria-hidden="true"><rect x="4.4" y="1.8" width="7.2" height="12.4" rx="1.8" /><path d="M7 12h2" /></svg>
          </button>
          <button type="button" class="bicon" :aria-pressed="inspect" :disabled="status !== 'ready'" :title="t('Осмотр: нажмите на элемент в предпросмотре, чтобы перейти к полю', 'Inspect: click an element in the preview to jump to its field')" :aria-label="t('Осмотр', 'Inspect')" @click="inspect = !inspect">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l4 10 1.6-4.4L13 7z" /></svg>
          </button>
        </div>
      </div>

      <div class="bprev-bar" role="group" :aria-label="t('Сценарий', 'Scenario')">
        <button type="button" class="bpill" :aria-pressed="connected" @click="connected = !connected"><i class="bdot" :data-on="connected ? '' : undefined" />{{ connected ? t('Подключено', 'Connected') : t('Отключено', 'Disconnected') }}</button>
        <label class="bnum"><span>{{ t('Трафик', 'Used') }}</span><input v-model.number="usedGb" type="number" min="0" step="1" inputmode="decimal" :aria-label="t('Использовано ГБ', 'Used GB')"><span>/</span><input v-model.number="totalGb" type="number" min="0" step="1" inputmode="decimal" :aria-label="t('Всего ГБ, 0 — без лимита', 'Total GB, 0 is unlimited')"><span>{{ totalGb ? t('ГБ', 'GB') : '∞' }}</span></label>
        <label class="bnum"><input :checked="expires" type="checkbox" :aria-label="t('Срок подписки', 'Subscription expires')" @change="expires = ($event.target as HTMLInputElement).checked"><span>{{ t('Дней', 'Days') }}</span><input v-model.number="daysLeft" type="number" min="0" step="1" inputmode="numeric" :disabled="!expires" :aria-label="t('Осталось дней', 'Days left')"></label>
        <label class="bnum"><span class="sr-only">{{ t('Платформа', 'Platform') }}</span>
          <select :value="platform" class="bprev-select" @change="platform = ($event.target as HTMLSelectElement).value as Platform">
            <option value="android">Android</option><option value="windows">Windows</option><option value="macos">macOS</option><option value="linux">Linux</option>
          </select>
        </label>
      </div>
    </dialog>
  </div>
</template>
