<script setup lang="ts">
const props = defineProps<{ src: string, title: string, width: number, height: number, expanded?: boolean, labels: { zoomIn: string, zoomOut: string, fit: string } }>()
const viewport = useTemplateRef<HTMLDivElement>('viewport')
const pad = 24
const readable = 0.8
const maxScale = 4
const scale = ref(readable)
const x = ref(pad)
const y = ref(pad)
const box = { width: 0, height: 0 }
let touched = false
const pointers = new Map<number, { x: number, y: number }>()
let pinch = 0
let observer: ResizeObserver | undefined

const fitScale = () => Math.min((box.width - pad * 2) / props.width, props.expanded ? (box.height - pad * 2) / props.height : Infinity, 1)
const minScale = () => Math.min(fitScale(), 0.25)

function clamp() {
  const width = props.width * scale.value
  const height = props.height * scale.value
  x.value = width + pad * 2 <= box.width ? (box.width - width) / 2 : Math.min(pad, Math.max(box.width - width - pad, x.value))
  y.value = height + pad * 2 <= box.height ? (box.height - height) / 2 : Math.min(pad, Math.max(box.height - height - pad, y.value))
}

function zoomAt(next: number, originX = box.width / 2, originY = box.height / 2) {
  const value = Math.min(maxScale, Math.max(minScale(), next))
  const ratio = value / scale.value
  x.value = originX - (originX - x.value) * ratio
  y.value = originY - (originY - y.value) * ratio
  scale.value = value
  touched = true
  clamp()
}

function reset() {
  const fit = fitScale()
  scale.value = Math.max(fit, Math.min(readable, props.expanded ? (box.height - pad * 2) / props.height : 1))
  x.value = pad
  y.value = pad
  touched = false
  clamp()
}

function measure() {
  const element = viewport.value
  if (!element) return
  box.width = element.clientWidth
  box.height = element.clientHeight
  if (touched) clamp()
  else reset()
}

function local(event: { clientX: number, clientY: number }) {
  const rect = viewport.value!.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onWheel(event: WheelEvent) {
  if (props.expanded || event.ctrlKey || event.metaKey) {
    event.preventDefault()
    const point = local(event)
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
    zoomAt(scale.value * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0015)), point.x, point.y)
    return
  }
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || props.width * scale.value + pad * 2 <= box.width) return
  event.preventDefault()
  x.value -= event.deltaX
  touched = true
  clamp()
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  viewport.value!.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, local(event))
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y)
  }
}

function onPointerMove(event: PointerEvent) {
  const previous = pointers.get(event.pointerId)
  if (!previous) return
  const point = local(event)
  pointers.set(event.pointerId, point)
  if (pointers.size === 1) {
    x.value += point.x - previous.x
    y.value += point.y - previous.y
    touched = true
    clamp()
    return
  }
  const [a, b] = [...pointers.values()]
  const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y)
  if (pinch > 0) zoomAt(scale.value * distance / pinch, (a!.x + b!.x) / 2, (a!.y + b!.y) / 2)
  pinch = distance
}

function onPointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId)
  pinch = 0
}

function onDoubleClick(event: MouseEvent) {
  const point = local(event)
  if (scale.value >= maxScale) reset()
  else zoomAt(scale.value * 2, point.x, point.y)
}

function onKey(event: KeyboardEvent) {
  const pan: Record<string, [number, number]> = { ArrowLeft: [48, 0], ArrowRight: [-48, 0], ArrowUp: [0, 48], ArrowDown: [0, -48] }
  if (event.key === '+' || event.key === '=') zoomAt(scale.value * 1.25)
  else if (event.key === '-') zoomAt(scale.value / 1.25)
  else if (event.key === '0') reset()
  else if (pan[event.key] && (props.expanded || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    x.value += pan[event.key]![0]
    y.value += pan[event.key]![1]
    touched = true
    clamp()
  }
  else return
  event.preventDefault()
}

const frameHeight = computed(() => props.expanded ? undefined : `min(70vh, ${Math.ceil(props.height * Math.min(readable, 1) + pad * 2)}px)`)

onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(viewport.value!)
})
onBeforeUnmount(() => observer?.disconnect())
defineExpose({ focus: () => viewport.value?.focus() })
</script>

<template>
  <div class="hb-diagram-view" :class="{ 'is-expanded': expanded }">
    <div
      ref="viewport" class="hb-diagram-canvas" tabindex="0" role="region" :aria-label="title" :style="{ height: frameHeight }"
      @wheel="onWheel" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp"
      @dblclick="onDoubleClick" @keydown="onKey"
    >
      <img
        :src="src" alt="" :width="width" :height="height" draggable="false" decoding="async"
        :style="{ width: `${width * scale}px`, height: `${height * scale}px`, transform: `translate(${x}px, ${y}px)` }"
      >
    </div>
    <div class="hb-diagram-tools">
      <button type="button" :aria-label="labels.zoomOut" :title="labels.zoomOut" @click="zoomAt(scale / 1.25)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg></button>
      <output>{{ Math.round(scale * 100) }}%</output>
      <button type="button" :aria-label="labels.zoomIn" :title="labels.zoomIn" @click="zoomAt(scale * 1.25)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
      <button type="button" :aria-label="labels.fit" :title="labels.fit" @click="reset"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5" /></svg></button>
      <slot />
    </div>
  </div>
</template>
