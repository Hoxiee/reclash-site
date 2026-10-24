<script setup lang="ts">
import type { Spring } from '~~/shared/motion/core'
import type { Magnet } from '~/motion/types'

// Sticky stand switcher: follows the scroll, jumps to a stand on a spring and lands it with a
// short highlight. Every #mock-* link inside the stand list (the index cards too) jumps the same way.
const props = defineProps<{ stands: Array<{ key: string, name: string, style: Record<string, string>, stock: boolean }> }>()
const { t } = useText()
const motion = usePageMotion()
const bar = useTemplateRef<HTMLElement>('bar'), strip = useTemplateRef<HTMLElement>('strip')
const active = ref(props.stands[0]!.key)
const index = computed(() => props.stands.findIndex(stand => stand.key === active.value))
const pad = (value: number) => String(value + 1).padStart(2, '0')

let magnet: Magnet | undefined, spring: Spring | undefined, owner: unknown
let jumping = false, landTimer = 0, observer: IntersectionObserver | undefined
const listeners: Array<() => void> = []
const chip = (key: string) => strip.value?.querySelector<HTMLElement>(`[data-key="${key}"]`) ?? null

function mount() {
  const runtime = motion.value
  if (!runtime || !strip.value || owner === runtime) return
  owner = runtime
  magnet = runtime.M.magnetGroup(strip.value, { items: 'a', sticky: true, contentPull: 0 })
  spring = runtime.M.spring(scrollY, { stiffness: 150, damping: 26, precision: 0.5 })
  spring.onUpdate = (y: number) => { if (jumping) scrollTo(0, y) }
  spring.onRest = () => { if (jumping) { jumping = false; land() } }
  runtime.scope.frame(() => magnet?.select(chip(active.value)))
}

// The bar sits higher when the nav has hidden itself, which it does whenever the page scrolls down.
function offset(down: boolean) {
  return (down ? 12 : 84) + (bar.value?.offsetHeight ?? 0) + 18
}

function land() {
  const target = document.getElementById(`mock-${active.value}`)
  if (!target) return
  target.classList.remove('is-landed'); void target.offsetWidth; target.classList.add('is-landed')
  clearTimeout(landTimer)
  landTimer = window.setTimeout(() => target.classList.remove('is-landed'), 1300)
  target.querySelector<HTMLElement>('.mock-stand-name')?.focus({ preventScroll: true })
}

function jump(key: string) {
  const target = document.getElementById(`mock-${key}`)
  if (!target) return
  const top = target.getBoundingClientRect().top + scrollY
  const down = top > scrollY
  const y = Math.max(0, Math.min(top - offset(down), document.documentElement.scrollHeight - innerHeight))
  active.value = key
  history.replaceState(history.state, '', `#mock-${key}`)
  if (!spring || motion.value?.M.reduced) {
    scrollTo({ top: y, behavior: 'instant' })
    land()
    return
  }
  jumping = false
  spring.set(scrollY)
  jumping = true
  spring.to(y)
}

function step(delta: number) {
  const next = props.stands[index.value + delta]
  if (next) jump(next.key)
}

function keys(event: KeyboardEvent) {
  const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  const next = props.stands[index.value + delta]
  if (!delta || !next) return
  event.preventDefault()
  jump(next.key)
  chip(next.key)?.focus({ preventScroll: true })
}

// A wheel, a touch or a key takes the scroll back from a running jump.
function interrupt(event: Event) {
  if (!jumping || bar.value?.contains(event.target as Node)) return
  jumping = false
  spring?.set(scrollY)
}

function follow(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#mock-"]')
  if (!link) return
  event.preventDefault()
  jump(link.getAttribute('href')!.slice(6))
}

watch(motion, mount)
watch(active, (key) => {
  magnet?.select(chip(key))
  const element = chip(key), box = strip.value
  if (element && box) {
    const left = element.offsetLeft - (box.clientWidth - element.offsetWidth) / 2
    box.scrollTo({ left: Math.max(0, left), behavior: motion.value?.M.reduced ? 'auto' : 'smooth' })
  }
})

onMounted(() => {
  mount()
  const list = bar.value?.closest('.mock-list')
  if (list) {
    list.addEventListener('click', follow as EventListener)
    listeners.push(() => list.removeEventListener('click', follow as EventListener))
  }
  for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(type, interrupt, { passive: true })
    listeners.push(() => window.removeEventListener(type, interrupt))
  }
  // Scroll-spy: the stand crossing a thin line at 40% of the viewport is current.
  if (!('IntersectionObserver' in window)) return
  observer = new IntersectionObserver((entries) => {
    if (jumping) return
    const current = entries.filter(entry => entry.isIntersecting).at(-1)
    if (current) active.value = current.target.id.slice(5)
  }, { rootMargin: '-40% 0px -59% 0px' })
  for (const stand of props.stands) {
    const element = document.getElementById(`mock-${stand.key}`)
    if (element) observer.observe(element)
  }
})
onBeforeUnmount(() => {
  jumping = false
  clearTimeout(landTimer)
  observer?.disconnect()
  for (const remove of listeners) remove()
})
</script>

<template>
  <nav ref="bar" class="mock-switch" :aria-label="t('Переключение стендов', 'Stand switcher')">
    <button class="mock-switch-step" type="button" :disabled="index <= 0" :aria-label="t('Предыдущий стенд', 'Previous stand')" @click="step(-1)">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>
    </button>
    <div ref="strip" class="mock-switch-strip" @keydown="keys">
      <a
        v-for="(stand, i) in stands"
        :key="stand.key"
        :data-key="stand.key"
        :href="`#mock-${stand.key}`"
        class="mock-switch-chip theme-scope"
        :style="stand.style"
        :aria-current="active === stand.key ? 'location' : undefined"
      >
        <span class="mock-switch-dot" :class="{ 'is-stock': stand.stock }" aria-hidden="true" />
        <span class="mock-switch-n" aria-hidden="true">{{ pad(i) }}</span>
        {{ stand.name }}
      </a>
    </div>
    <span class="mock-switch-count" aria-hidden="true">{{ pad(index) }} / {{ String(stands.length).padStart(2, '0') }}</span>
    <button class="mock-switch-step" type="button" :disabled="index >= stands.length - 1" :aria-label="t('Следующий стенд', 'Next stand')" @click="step(1)">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
    </button>
  </nav>
</template>
