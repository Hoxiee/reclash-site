<script setup lang="ts">
import type { MockProfile } from '~~/shared/provider/mocks'
import { mockExpire } from '~~/shared/provider/mocks'
import { subscriptionTypeText } from '~~/shared/provider/standard'
import { mockName, mockStrip, mockTheme, mockText, stockRing } from '~~/shared/provider/mockview'
import { countdownText, iconPath, powerPath, policyBadges, previewCards, previewManifest, providerLogo, rec, relevantLabel, routingTitles, str, wallpaperOf } from './view'

// A schematic subscription-data preview drawn from the manifest, not a replica of the app interface.
const props = defineProps<{ profile: MockProfile, now: number }>()
const { language, t } = useText()

const manifest = computed(() => previewManifest(props.profile, props.now))
const provider = computed(() => rec(manifest.value.provider))
const theme = computed(() => mockTheme(props.profile))
const strip = computed(() => mockStrip(props.profile, props.now, language.value))
const name = computed(() => mockName(props.profile, language.value))
const logo = computed(() => providerLogo(manifest.value))
const wallpaper = computed(() => wallpaperOf(manifest.value))
const subscriptionType = computed(() => {
  const type = str(provider.value?.type)
  return type && subscriptionTypeText(type)?.[language.value]
})
const server = computed(() => str(provider.value?.['server-group']) ?? `${name.value} 01`)
const announce = computed(() => mockText(rec(provider.value?.announce)?.text, language.value) ?? (props.profile.headers?.announce))
const notice = computed(() => mockText(rec(provider.value?.notice)?.text, language.value))
const cards = computed(() => previewCards(manifest.value, language.value))
const actions = computed(() => cards.value.filter(card => card.type === 'actions'))
const days = computed(() => props.profile.quota ? Math.max(0, Math.floor((mockExpire(props.profile.quota, props.now) * 1000 - props.now) / 86_400_000)) : 0)
const label = computed(() => relevantLabel(manifest.value, language.value, { server: server.value, daysLeft: String(days.value), trafficLeft: strip.value.value }))
const policy = computed(() => policyBadges(manifest.value, language.value))
const routing = computed(() => routingTitles(props.profile, language.value))
const ring = computed(() => {
  const colors = stockRing.map(color => `#${color}`)
  const tint = (color: string) => !theme.value.seed ? color : `color-mix(in oklch, ${color} 62%, var(--brand))`
  return { '--r1': tint(colors[0]!), '--r2': tint(colors[1]!), '--r3': tint(colors[2]!) }
})
</script>

<template>
  <figure class="mock-pv theme-scope" :class="{ 'is-black': theme.pureBlack }" :style="theme.style">
    <div class="mock-app">
      <div
        v-if="wallpaper"
        class="mock-app-bg"
        aria-hidden="true"
        :style="{ backgroundImage: `url(${wallpaper.url})`, opacity: Math.min(1, wallpaper.opacity / 100 + 0.4) }"
      />

      <header class="mock-app-head">
        <span class="mock-app-logo" aria-hidden="true">
          <img v-if="logo" :src="logo" alt="" width="40" height="40" loading="lazy">
          <svg v-else viewBox="0 0 32 32">
            <path d="M16 4.5a11.5 11.5 0 1 1-10.9 7.8" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
            <circle cx="16" cy="16" r="3.6" fill="currentColor" />
          </svg>
        </span>
        <span class="mock-app-id">
          <b>{{ name }}</b>
          <small v-if="subscriptionType">{{ subscriptionType }}</small>
        </span>
        <span class="mock-app-power" :style="ring" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path :d="powerPath" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
        </span>
      </header>
      <div class="mock-app-status">
        <span class="mock-app-server"><i aria-hidden="true" />{{ server }}</span>
        <span v-if="label" class="mock-app-label" :data-state="label.state">{{ label.title }}</span>
      </div>

      <ul v-if="policy.length" class="mock-badges" :aria-label="t('Ограничения политики', 'Policy limits')">
        <li v-for="badge in policy" :key="badge">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7M3.5 7h9v6.5h-9z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /></svg>
          {{ badge }}
        </li>
      </ul>

      <div v-if="announce" class="mock-app-note" :class="{ 'is-warn': profile.tone === 'warn' }">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3.2v4.1m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        <span>{{ announce }}</span>
      </div>
      <div v-if="notice" class="mock-app-note is-warn">
        <span>{{ notice }}</span>
      </div>

      <div v-if="profile.quota" class="mock-strip">
        <div class="mock-strip-top">
          <span class="mock-strip-name">{{ name }}</span>
          <span class="mock-strip-pill" :class="`is-${strip.pill.tone}`">{{ strip.pill.text }}</span>
        </div>
        <p class="mock-strip-value"><b>{{ strip.value }}</b> <span>{{ strip.of }}</span></p>
        <div class="mock-strip-bar" :class="[`is-${strip.bar}`, { 'is-free': strip.unlimited }]">
          <i :style="{ width: strip.unlimited ? '100%' : `${Math.max(2, Math.round(strip.share * 100))}%` }" />
        </div>
        <div v-if="strip.offers.length" class="mock-strip-offers">
          <span v-for="offer in strip.offers" :key="offer">{{ offer }}</span>
        </div>
      </div>

      <div v-if="cards.length" class="mock-cards">
        <template v-for="card in cards" :key="card.id">
          <article v-if="card.layout === 'hero' || card.layout === 'image'" class="mock-card mock-card-hero" :class="{ 'is-image': !card.title }" :style="card.image ? { backgroundImage: `url(${card.image})` } : undefined">
            <span v-if="card.countdown" class="mock-chip mock-chip-time">{{ countdownText(card.countdown, now, language) }}</span>
            <b>{{ card.title }}</b>
            <span v-if="card.button" class="mock-card-btn">{{ card.button }}</span>
          </article>
          <article v-else-if="card.type !== 'actions'" class="mock-card mock-card-note" :class="[`is-${card.level}`, { 'has-img': card.image }]">
            <i aria-hidden="true" />
            <span><b v-if="card.title">{{ card.title }}</b><small>{{ card.text }}</small></span>
            <img v-if="card.image" :src="card.image" alt="" width="48" height="48" loading="lazy">
          </article>
        </template>
        <ul v-for="(card, i) in actions" :key="`a${i}`" class="mock-acts-row is-small">
          <li v-for="item in card.items" :key="item.label">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="iconPath(item.icon)" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </div>

      <div v-if="routing.length" class="mock-route">
        <p>{{ t('Профили маршрутизации', 'Routing profiles') }}</p>
        <ul><li v-for="title in routing" :key="title">{{ title }}</li></ul>
      </div>
    </div>
    <figcaption class="sr-only">
      {{ t('Схема данных из манифеста, не скриншот приложения.', 'A data schematic from the manifest, not an app screenshot.') }}
    </figcaption>
  </figure>
</template>
