<script setup lang="ts">
const { t } = useText()
const slides = computed(() => [
  { src: 'mobile-dashboard', w: 730, h: 1438, title: t('Одна кнопка', 'One button'), text: t('Подключение, страна и остаток подписки на одном экране.', 'Connection, location and what is left on the subscription, on one screen.') },
  { src: 'mobile-widgets', w: 730, h: 1438, title: t('Объявления провайдера', 'Provider announcements'), text: t('На вкладке «Виджеты» рядом с главной ваше объявление и уведомление о работах стоят первыми.', 'On the Widgets tab next to Home, your announcement and maintenance notice come first.') },
  { src: 'mobile-branded', w: 730, h: 1438, title: t('Клиент в цветах провайдера', 'Your provider\'s look'), text: t('Логотип, фон и кнопка приходят вместе с подпиской.', 'Logo, background and button arrive with the subscription.') },
  { src: 'mobile-profiles', w: 730, h: 1438, title: t('Подписки как карты в кошельке', 'Subscriptions as wallet cards'), text: t('Трафик и срок каждой видны сразу.', 'Traffic and expiry of each one at a glance.') },
  { src: 'mobile-proxies', w: 730, h: 1438, title: t('Избранное и цепочки', 'Favorites and chains'), text: t('Любимые серверы и маршруты через домашний вход наверху, у каждого видна задержка.', 'Favorite servers and routes through a home entry on top, each with its latency.') },
  { src: 'desktop-dashboard', w: 1698, h: 1098, title: t('На компьютере так же просто', 'Just as simple on desktop'), text: t('Тот же экран на Windows, macOS и Linux.', 'The same screen on Windows, macOS and Linux.') },
  { src: 'desktop-branded', w: 1698, h: 1098, title: t('Оформление провайдера везде', 'Provider style everywhere'), text: t('Брендинг подписки работает и на десктопе.', 'Subscription branding carries over to the desktop.') },
  { src: 'desktop-profiles', w: 1698, h: 1098, title: t('Кошелёк на большом экране', 'The wallet on a big screen'), text: t('Все подписки и их остатки в одном месте.', 'Every subscription and its balance in one place.') },
])
// Three copies make the ribbon endless: the middle one is real, the outer ones are recentred after scrolling stops.
const count = computed(() => slides.value.length)
const ribbon = computed(() => [0, 1, 2].flatMap(copy => slides.value.map((slide, index) => ({ ...slide, copy, index, at: copy * count.value + index }))))
const track = ref<HTMLElement>()
const at = ref(count.value)
const active = computed(() => at.value % count.value)
let observer: IntersectionObserver | undefined
let settle: ReturnType<typeof setTimeout> | undefined

const centre = (index: number, smooth: boolean) => {
  const el = track.value?.children[index] as HTMLElement | undefined
  if (!el || !track.value) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  track.value.scrollTo({ left: el.offsetLeft - (track.value.clientWidth - el.clientWidth) / 2, behavior: smooth && !reduce ? 'smooth' : 'auto' })
}
const go = (index: number) => centre(index, true)
const pick = (index: number) => go(at.value + index - active.value)
const recentre = () => {
  const el = track.value
  if (!el || (at.value >= count.value && at.value < count.value * 2)) return
  const span = (el.children[count.value] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft
  const shift = at.value < count.value ? count.value : -count.value
  at.value += shift
  el.scrollTo({ left: el.scrollLeft + Math.sign(shift) * span, behavior: 'auto' })
}
const onScroll = () => {
  clearTimeout(settle)
  settle = setTimeout(recentre, 140)
}
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'ArrowRight') { event.preventDefault(); go(at.value + 1) }
  if (event.key === 'ArrowLeft') { event.preventDefault(); go(at.value - 1) }
}

onMounted(() => {
  if (!track.value) return
  centre(at.value, false)
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) at.value = Number((entry.target as HTMLElement).dataset.at)
    }
  }, { root: track.value, rootMargin: '0px -45% 0px -45%' })
  for (const el of Array.from(track.value.children)) observer.observe(el)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(settle)
})
</script>

<template>
<div class="slider" role="region" aria-roledescription="carousel" :aria-label="t('Скриншоты ReClash', 'ReClash screenshots')">
  <div ref="track" class="slider-track" tabindex="0" @keydown="onKey" @scroll.passive="onScroll">
    <figure v-for="slide in ribbon" :key="slide.at" class="slide" :class="{ 'is-active': slide.at === at, 'is-wide': slide.w > slide.h }" :data-at="slide.at" :aria-hidden="slide.copy !== 1 || undefined" role="group" aria-roledescription="slide" :aria-label="`${slide.index + 1} / ${count}`" @click="go(slide.at)">
      <img :src="`/assets/screens/${slide.src}-dark.webp`" :width="slide.w" :height="slide.h" :alt="slide.title" loading="lazy" decoding="async" draggable="false">
      <figcaption><b>{{ slide.title }}</b><span>{{ slide.text }}</span></figcaption>
    </figure>
  </div>
  <div class="slider-bar">
    <button type="button" class="slider-btn" :aria-label="t('Предыдущий', 'Previous')" @click="go(at - 1)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="slider-dots">
      <button v-for="(slide, index) in slides" :key="slide.src" type="button" class="slider-dot" :class="{ 'is-active': index === active }" :aria-label="slide.title" :aria-current="index === active" @click="pick(index)" />
    </div>
    <button type="button" class="slider-btn" :aria-label="t('Следующий', 'Next')" @click="go(at + 1)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
</div>
</template>
