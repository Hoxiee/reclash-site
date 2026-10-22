<script setup lang="ts">
import { galleryItems } from '~~/shared/site/gallery'
const { language, t } = useText()
const motion = usePageMotion()
const grid = useTemplateRef<HTMLElement>('grid'), chips = useTemplateRef<HTMLElement>('chips')
const current = ref('all')
let magnet: { select: (element: Element | null) => void } | undefined
watch(motion, runtime => {
  if (!runtime || !chips.value) return
  magnet = runtime.M.magnetGroup(chips.value, { items: 'button', sticky: true, pull: 0, contentPull: 0 })
  runtime.scope.frame(() => magnet?.select(chips.value!.querySelector('[aria-pressed="true"]')))
})
async function filter(cat: string, event: Event) {
  const tiles = [...grid.value!.querySelectorAll<HTMLElement>('.g-item')]
  const before = new Map(tiles.filter(tile => !tile.classList.contains('is-hidden')).map(tile => [tile, tile.getBoundingClientRect()]))
  current.value = cat; magnet?.select(event.currentTarget as Element)
  await nextTick()
  const runtime = motion.value
  if (!runtime || runtime.M.reduced) return
  for (const tile of tiles) {
    if (tile.classList.contains('is-hidden')) continue
    const b = before.get(tile), a = tile.getBoundingClientRect()
    if (!b) {
      const ease = runtime.M.cssEase('bouncy')
      runtime.scope.animate(tile, [{ transform: 'scale(.82)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: ease.duration, easing: ease.easing })
      continue
    }
    const dx = b.left - a.left, dy = b.top - a.top, sx = b.width / a.width, sy = b.height / a.height
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(sx - 1) + Math.abs(sy - 1) < .5) continue
    const ease = runtime.M.cssEase('jelly')
    runtime.scope.animate(tile, [{ transformOrigin: '0 0', transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` }, { transformOrigin: '0 0', transform: 'none' }], { duration: ease.duration, easing: ease.easing })
  }
}
</script>

<template>
  <div class="g-bar"><div id="g-filter" ref="chips" class="plat-tabs" role="group" :aria-label="t('Фильтр', 'Filter')">
    <button v-for="(label, cat) in { all: t('Всё', 'All'), client: t('Клиент', 'Client'), dpi: t('Обход', 'Bypass'), themes: t('Темы', 'Themes') }" :key="cat" type="button" :data-cat="cat" :aria-pressed="current === cat" @click="filter(cat, $event)">{{ label }}</button>
  </div></div>
  <ul id="g-grid" ref="grid" class="g-grid">
    <li v-for="(item, i) in galleryItems" :key="i" class="g-item" :class="{ wide: 'wide' in item && item.wide, 'is-hidden': current !== 'all' && item.cat !== current }" :data-cat="item.cat">
      <video v-if="item.video" class="g-art" :src="item.video" muted loop playsinline autoplay preload="metadata" />
      <img v-else-if="item.src" class="g-art" :src="item.src" :alt="item.title[language]" loading="lazy" style="object-fit:cover">
      <svg v-else class="g-art" viewBox="0 0 420 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <template v-if="item.cat === 'client'">
          <rect class="mv" :style="`--tx:${8 + i * 3}px`" x="60" y="70" width="200" height="22" rx="11" fill="var(--bg-3)" />
          <rect class="mv" style="--tx:-14px" x="60" y="110" width="140" height="22" rx="11" fill="var(--bg-3)" />
          <rect class="mv" style="--tx:20px" x="60" y="150" width="170" height="22" rx="11" fill="var(--brand-soft)" />
          <circle class="mv" style="--ty:-10px" cx="320" cy="120" :r="36 + (i % 3) * 6" fill="none" stroke="var(--brand)" stroke-width="10" />
        </template>
        <template v-else-if="item.cat === 'dpi'">
          <path d="M220 30v80M220 170v80" stroke="var(--fg-3)" stroke-width="6" stroke-linecap="round" />
          <path d="M30 140h360" stroke="var(--line-2)" stroke-width="3" stroke-dasharray="4 10" />
          <rect class="mv" style="--tx:150px;--ty:-16px" x="40" y="118" width="54" height="44" rx="12" fill="var(--brand)" />
          <rect class="mv" style="--tx:90px" x="100" y="118" width="54" height="44" rx="12" fill="none" stroke="var(--brand-2)" stroke-width="6" />
        </template>
        <template v-else><circle v-for="k in [0, 1, 2]" :key="k" class="mv" :style="`--ty:${k % 2 ? -14 : 12}px`" :cx="120 + k * 90" cy="140" r="46" :fill="['var(--brand-3)', 'var(--brand)', 'var(--brand-2)'][(k + i) % 3]" :opacity=".55 + k * .2" /></template>
      </svg>
      <span class="g-kind" :class="{ soon: !item.src && !item.video }"><i />{{ item.type[language] }}{{ !item.src && !item.video ? t(', скоро', ', coming soon') : '' }}</span>
      <div class="g-cap"><b>{{ item.title[language] }}</b></div>
    </li>
  </ul>
</template>
