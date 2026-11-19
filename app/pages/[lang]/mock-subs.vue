<script setup lang="ts">
import { mockProfiles } from '~~/shared/provider/mocks'
import { mockTheme } from '~~/shared/provider/mockview'
import { previewCards, previewManifest, providerLogo, scenariosLabel } from '~/components/mock/view'
import '~/assets/css/mock.css'

usePageMeta('mock-subs')
const { language, t } = useToolText()
const origin = useRuntimeConfig().public.siteOrigin
// Relative expiries are computed once on the server and reused on hydration, matching the build's _headers.
const now = useState('mock-subs-now', () => Date.now())

const count = computed(() => scenariosLabel(mockProfiles.length, language.value))
const stands = computed(() => mockProfiles.map((profile) => {
  const theme = mockTheme(profile)
  const manifest = previewManifest(profile, now.value)
  const image = previewCards(manifest, language.value).find(card => card.image)?.image
  return { key: profile.key, name: profile.name[language.value], scenario: profile.scenario[language.value], style: theme.style, stock: !theme.seed, image, logo: providerLogo(manifest) }
}))

const current = ref(mockProfiles[0]!.key)
const profile = computed(() => mockProfiles.find(item => item.key === current.value) ?? mockProfiles[0]!)
const stand = useTemplateRef<HTMLElement>('stand')
const route = useRoute()

function select(key: string) {
  current.value = key
  history.replaceState(history.state, '', `#mock-${key}`)
  nextTick(() => {
    if ((stand.value?.getBoundingClientRect().top ?? 0) < 0) stand.value?.scrollIntoView({ block: 'start' })
  })
}

function fromHash(hash: string) {
  const key = hash.replace(/^#(mock-)?/, '')
  if (mockProfiles.some(item => item.key === key)) current.value = key
}
onMounted(() => fromHash(route.hash || location.hash))
watch(() => route.hash, fromHash)
</script>

<template>
  <div class="mock-page">
    <PageHero
      :title="t('Мок-подписки', 'Mock subscriptions')"
      :lede="t(`${count}: от голого минимума до полного оформления провайдера. Выберите стенд, импортируйте его в ReClash и сравните с тем, что отдаёт сервер.`, `${count}: from the bare minimum to full provider branding. Pick a stand, import it into ReClash and compare with what the server returns.`)"
      glyph="M150 168h100M150 200h100M150 232h60"
    >
      <template #eyebrow>{{ t('Для тестирования', 'For testing') }}</template>
      <template #tags>
        <span class="tag mock-warn" role="note">{{ t('Узлы на 127.0.0.1, ссылки и цифры вымышлены', 'Nodes point to 127.0.0.1; links and figures are invented') }}</span>
      </template>
    </PageHero>

    <section class="sub-sec mock-list" :aria-label="t('Стенды', 'Stands')">
      <div class="wrap mock-shell">
        <MockCatalog :stands="stands" :current="current" @select="select" />
        <div ref="stand" class="mock-shell-pane">
          <MockStand :key="profile.key" :profile="profile" :index="mockProfiles.indexOf(profile)" :total="mockProfiles.length" :origin="origin" :now="now" />
        </div>
      </div>
    </section>
  </div>
</template>
