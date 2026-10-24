<script setup lang="ts">
import type { Spring } from '~~/shared/motion/core'
import type { PageMotion } from '~/composables/usePageMotion'
import { headerCategories, transformLabels, referenceAnchor, type HeaderEntry } from '~~/shared/provider/reference'
// One catalogue entry: a native <details> so the summary is keyboard-operable
// and the content stays in the prerendered HTML; the page owns the open state.
const props = defineProps<{ entry: HeaderEntry, open: boolean, terms: readonly string[] }>()
const emit = defineEmits<{ toggle: [open: boolean] }>()
const { language, t } = useText()
const motion = usePageMotion()
const root = useTemplateRef<HTMLDetailsElement>('root')

const category = computed(() => headerCategories.find(item => item.key === props.entry.category)!)
const transform = computed(() => props.entry.transform === 'none' ? undefined : transformLabels[props.entry.transform])

// Split the name around the first matching search term so the match can be marked.
const nameParts = computed(() => {
  const name = props.entry.name
  for (const term of [...props.terms].sort((a, b) => b.length - a.length)) {
    const at = term ? name.indexOf(term) : -1
    if (at >= 0) return [name.slice(0, at), name.slice(at, at + term.length), name.slice(at + term.length)] as const
  }
  return [name, '', ''] as const
})

/*
 * Opening and closing ride a height spring, so a toggle mid-way reverses from the current height
 * with its velocity. `shown` mirrors the element's own `open` attribute, which stays set while the
 * card collapses and is removed once the spring rests. Without the motion runtime, under reduced
 * motion or off screen the card switches at once.
 */
const shown = ref(props.open)
const closing = ref(false)
const opening = { stiffness: 230, damping: 26 }, collapsing = { stiffness: 300, damping: 34 }
let goal = props.open, floor = 0
let spring: Spring | undefined, owner: PageMotion | undefined, fades: Animation[] = []

const reduced = (runtime: PageMotion) => runtime.M.reduced || document.documentElement.classList.contains('rm')
const linear = () => CSS.supports('transition-timing-function', 'linear(0, 1)')
function onScreen(element: Element) {
  const box = element.getBoundingClientRect()
  return box.height > 0 && box.bottom > 0 && box.top < innerHeight
}
// Spring.dispose() only releases the frame job; the spring stays usable afterwards.
const halt = () => spring?.dispose()
function stopFades() { for (const fade of fades) fade.cancel(); fades = [] }

function settle() {
  const element = root.value
  halt()
  closing.value = false
  if (!element) return
  element.style.removeProperty('height')
  element.style.removeProperty('overflow')
  if (!goal) { element.open = false; shown.value = false; stopFades() }
}

function jump(open: boolean) {
  goal = open
  halt()
  stopFades()
  if (open && root.value) { shown.value = true; root.value.open = true }
  settle()
}

function springFor(runtime: PageMotion) {
  if (owner === runtime && spring) return spring
  owner = runtime
  spring = runtime.M.spring(0, { precision: 1 })
  spring.onUpdate = value => root.value?.style.setProperty('height', `${Math.max(floor, value)}px`)
  spring.onRest = settle
  // A live switch to reduced motion snaps every spring to its target; finish the toggle with it.
  runtime.M.onReduced(on => { if (on) jump(goal) })
  return spring
}

// Body blocks rise in one after another and drop out together; a reversal starts where they are.
function fadeBody(open: boolean, runtime: PageMotion) {
  const items = [...root.value!.querySelector('.ref-body')!.children]
  const resume = fades.length > 0
  const starts = items.map(item => {
    const style = getComputedStyle(item)
    return { opacity: style.opacity, transform: style.transform }
  })
  stopFades()
  const ease = runtime.M.cssEase('smooth'), easing = linear() ? ease.easing : 'cubic-bezier(0.2, 0.8, 0.2, 1)'
  items.forEach((item, index) => {
    const from = resume || !open ? starts[index]! : { opacity: 0, transform: 'translateY(10px)' }
    const fade = open
      ? runtime.scope.animate(item, [from, { opacity: 1, transform: 'none' }],
          { duration: ease.duration, easing, delay: (resume ? 0 : 40) + index * 45, fill: 'backwards' })
      : runtime.scope.animate(item, [from, { opacity: 0, transform: 'translateY(-4px)' }],
          { duration: 140, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' })
    if (fade) fades.push(fade)
  })
}

function animate(open: boolean, runtime: PageMotion) {
  const element = root.value!, height = springFor(runtime)
  const from = height.running ? height.x : element.offsetHeight
  goal = open
  closing.value = !open
  if (open) { shown.value = true; element.open = true }
  // Measure the natural target with the inline height lifted, then pin the start in the same frame.
  element.style.removeProperty('height')
  floor = element.querySelector('summary')!.offsetHeight
  const to = open ? element.offsetHeight : floor
  element.style.overflow = 'hidden'
  element.style.overflow = 'clip'
  element.style.height = `${from}px`
  if (!height.running) height.set(from)
  height.to(to, open ? opening : collapsing)
  fadeBody(open, runtime)
  if (!height.running) settle()
}

watch(() => props.open, open => {
  const element = root.value, runtime = motion.value
  if (open === goal || !element) return
  // Expand all and collapse all animate only the cards in view; the rest switch at once.
  if (!runtime || reduced(runtime) || (!spring?.running && !onScreen(element))) jump(open)
  else animate(open, runtime)
})

// Every toggle goes through the page so the card can animate it; Enter and Space arrive as clicks.
function onSummary(event: MouseEvent) {
  event.preventDefault()
  emit('toggle', !props.open)
}

// The browser may open the card on its own (find-in-page, a script): adopt that state at once.
function onToggle() {
  const element = root.value
  if (!element || element.open === shown.value) return
  jump(element.open)
  if (element.open !== props.open) emit('toggle', element.open)
}

onBeforeUnmount(() => { halt(); stopFades() })
</script>

<template>
  <details
    :id="entry.id" ref="root" class="ref-card" :class="{ 'is-closing': closing }" :data-cat="entry.category"
    :open="shown" @toggle="onToggle"
  >
    <summary class="ref-sum" @click="onSummary">
      <span class="ref-sum-main">
        <span class="ref-sum-top">
          <code class="ref-name">{{ nameParts[0] }}<mark v-if="nameParts[1]">{{ nameParts[1] }}</mark>{{ nameParts[2] }}</code>
          <span class="ref-badges">
            <span class="ref-cat" :data-cat="entry.category">{{ category.badge[language] }}</span>
            <span v-if="entry.direction === 'request'" class="ref-chip">{{ t('запрос', 'request') }}</span>
            <span v-if="transform" class="ref-chip ref-chip-tf">{{ transform.short[language] }}</span>
            <span v-for="alias in entry.aliases" :key="alias" class="ref-chip ref-chip-alias" :title="t('псевдоним', 'alias')"><code>{{ alias }}</code></span>
          </span>
        </span>
        <span class="ref-lead"><ReferenceRich :text="entry.summary[language]" /></span>
      </span>
      <span class="ref-pm" aria-hidden="true" />
    </summary>
    <div class="ref-body">
      <dl class="ref-meta">
        <div v-if="entry.format">
          <dt>{{ t('Формат', 'Format') }}</dt>
          <dd><ReferenceRich :text="entry.format[language]" /></dd>
        </div>
        <div v-if="entry.direction === 'request'">
          <dt>{{ t('Направление', 'Direction') }}</dt>
          <dd>{{ t('Отправляет клиент в запросе подписки', 'Sent by the client with the subscription request') }}</dd>
        </div>
        <div v-if="entry.aliasOf">
          <dt>{{ t('Основной', 'Primary') }}</dt>
          <dd><a class="tlink" :href="`#${referenceAnchor(entry.aliasOf)}`"><code>{{ entry.aliasOf }}</code></a></dd>
        </div>
        <div v-if="entry.readOrder.length > 1">
          <dt>{{ t('Порядок чтения', 'Read order') }}</dt>
          <dd>
            <ol class="ref-chain">
              <li v-for="wire in entry.readOrder" :key="wire">
                <code v-if="wire === entry.name" class="is-self">{{ wire }}</code>
                <a v-else class="tlink" :href="`#${referenceAnchor(wire)}`"><code>{{ wire }}</code></a>
              </li>
            </ol>
          </dd>
        </div>
        <div v-if="transform">
          <dt>{{ t('Преобразование', 'Transform') }}</dt>
          <dd><ReferenceRich :text="transform.long[language]" /></dd>
        </div>
      </dl>
      <p v-if="entry.body[language] !== entry.summary[language]" class="ref-prose"><ReferenceRich :text="entry.body[language]" /></p>
      <ReferenceTable v-if="entry.table" :table="entry.table" />
      <CodeBlock v-if="entry.example" :code="entry.example" :label="t('Пример', 'Example')" />
      <a class="ref-perma" :href="`#${entry.id}`">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
        <span>{{ t('Ссылка на заголовок', 'Link to this header') }}</span>
      </a>
    </div>
  </details>
</template>
