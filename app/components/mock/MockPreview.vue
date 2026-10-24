<script setup lang="ts">
import type { MockProfile } from '~~/shared/provider/mocks'
import { mockStrip, mockTheme, stockRing } from '~~/shared/provider/mockview'

// The client's home screen for one stand: the hero orb with the service logo inside its ring,
// the status words and the subscription strip. The brand color stays inside .theme-scope.
const props = defineProps<{ profile: MockProfile, now: number }>()
const { language, t } = useText()

const response = computed(() => props.profile.response)
const theme = computed(() => mockTheme(props.profile))
const strip = computed(() => mockStrip(props.profile, props.now, language.value))
const name = computed(() => response.value.serviceName ?? props.profile.name[language.value])
const server = computed(() => response.value.serverInfo ?? `${name.value} 01`)
const announce = computed(() => response.value.announce?.[language.value])
// A provider ring is drawn as sent; the stock ring leans toward the brand like the client's harmonized one.
const ring = computed(() => {
  const own = response.value.heroRing
  const colors = (own ?? stockRing).map(color => `#${color}`)
  const tint = (color: string) => own || !theme.value.seed ? color : `color-mix(in oklch, ${color} 62%, var(--brand))`
  return { '--r1': tint(colors[0]!), '--r2': tint(colors[1]!), '--r3': tint(colors[2]!) }
})
</script>

<template>
  <figure class="mock-pv theme-scope" :class="{ 'is-black': theme.pureBlack }" :style="theme.style">
    <div class="mock-app">
      <div
        v-if="response.background"
        class="mock-app-bg"
        aria-hidden="true"
        :style="{ backgroundImage: `url(/assets/mock/${response.background.file})`, opacity: response.background.opacity / 100 }"
      />

      <div class="mock-orb" :style="ring" aria-hidden="true">
        <span class="mock-orb-halo" />
        <span class="mock-orb-ring" />
        <span class="mock-orb-core">
          <img v-if="response.logo" class="mock-orb-logo" :src="`/assets/mock/${response.logo}`" alt="" width="64" height="64" loading="lazy">
          <svg v-else class="mock-orb-mark" viewBox="0 0 32 32">
            <path d="M16 4.5a11.5 11.5 0 1 1-10.9 7.8" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
            <circle cx="16" cy="16" r="3.6" fill="currentColor" />
          </svg>
        </span>
      </div>
      <div class="mock-app-words">
        <b>{{ response.activeText ?? t('Вы защищены', 'You are protected') }}</b>
        <span class="mock-app-server"><i aria-hidden="true" />{{ server }}</span>
      </div>

      <div v-if="response.hwidLimit" class="mock-app-note is-warn">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2 14.5 13.5h-13Zm0 4.5v3m0 2v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span>{{ t('Достигнут лимит устройств. Отключите одно из устройств или напишите в поддержку.', 'Device limit reached. Remove one of your devices or contact support.') }}</span>
      </div>
      <div v-if="announce" class="mock-app-note">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3.2v4.1m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        <span>{{ announce }}</span>
      </div>
      <div v-if="response.newDomain" class="mock-app-note is-move">
        <span>{{ t('Новый адрес подписки', 'New subscription address') }}</span>
        <code>{{ response.newDomain }}</code>
      </div>

      <div class="mock-strip">
        <div class="mock-strip-top">
          <span class="mock-strip-name">{{ name }}</span>
          <span class="mock-strip-pill" :class="`is-${strip.pill.tone}`">{{ strip.pill.text }}</span>
          <svg v-if="announce" class="mock-strip-ann" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6.5v3h2l4 3v-9l-4 3Zm8.5-.5a3 3 0 0 1 0 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <svg class="mock-strip-go" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </div>
        <p class="mock-strip-value"><b>{{ strip.value }}</b> <span>{{ strip.of }}</span></p>
        <div class="mock-strip-bar" :class="[`is-${strip.bar}`, { 'is-free': strip.unlimited }]">
          <i :style="{ width: strip.unlimited ? '100%' : `${Math.max(2, Math.round(strip.share * 100))}%` }" />
        </div>
        <div v-if="strip.offers.length" class="mock-strip-offers">
          <span v-for="offer in strip.offers" :key="offer">{{ offer }}</span>
        </div>
      </div>
    </div>
    <figcaption class="mock-pv-cap">
      {{ theme.seed
        ? t(`Цвет ${theme.seed} из ReClash-Hex. Приближение: точные оттенки клиент считает по схеме Material.`, `Color ${theme.seed} from ReClash-Hex. An approximation: the client derives exact shades from the Material scheme.`)
        : t('Без ReClash-Hex клиент остаётся в стоковых цветах.', 'Without ReClash-Hex the client keeps its stock colors.') }}
    </figcaption>
  </figure>
</template>
