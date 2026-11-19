<script setup lang="ts">
import { classify, detect, releaseDate, score, type Device, type Platform } from '~~/shared/site/releases'
import type { PageMotion } from '~/composables/usePageMotion'
import type { ReleaseFeed } from '~/composables/useReleases'
const props = defineProps<{ feed: ReleaseFeed }>()
const { language, t } = useText()
const motion = usePageMotion()
const tabs = useTemplateRef<HTMLElement>('tabs'), list = useTemplateRef<HTMLElement>('list')
const osNames = { windows: 'Windows', macos: 'macOS', linux: 'Linux', android: 'Android' } as const
const osShort = { windows: 'W', macos: 'M', linux: 'L', android: 'A' }
type OS = Platform['os']
type Asset = Platform & { name: string, size: number, url: string }
const detected = ref<Device>(), chosen = ref<OS>()
const release = computed(() => props.feed.status === 'ready' ? props.feed.current : undefined)
const failure = computed(() => props.feed.status === 'error' ? props.feed.failure : '')
const loaded = computed(() => props.feed.status !== 'loading' && !!detected.value)
const groups = computed(() => {
  const result: Partial<Record<OS, Asset[]>> = {}
  for (const asset of release.value?.assets || []) {
    const platform = classify(asset.name)
    if (platform) (result[platform.os] ||= []).push({ ...platform, ...asset })
  }
  return result
})
const oses = computed(() => (Object.keys(osNames) as OS[]).filter(os => groups.value[os]))
const best = computed(() => {
  const me = detected.value
  if (!loaded.value || !me?.os || !(me.os in groups.value)) return undefined
  return groups.value[me.os as OS]?.slice().sort((a, b) => score(b, me) - score(a, me))[0]
})
const current = computed(() => chosen.value ?? best.value?.os ?? oses.value[0] ?? 'windows')
const assets = computed(() => groups.value[current.value] || [])
const kind = (value: string) => ({ Installer: t('Установщик', 'Installer', '安装程序'), Program: t('Программа', 'Program', '程序'), 'Portable ZIP': t('Портативный ZIP', 'Portable ZIP', '便携版 ZIP'), File: t('Файл', 'File', '文件') })[value] || value
const size = (bytes: number) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1).replace('.', t(',', '.', '.'))} ${t('МБ', 'MB', 'MB')}` : `${Math.round(bytes / 1024)} ${t('КБ', 'KB', 'KB')}`
const date = computed(() => release.value ? releaseDate(release.value.published, language.value) : '')
const heading = computed(() => !loaded.value ? '' : failure.value === 'none' ? t('Релизов пока нет', 'No releases yet', '暂无发行版')
  : failure.value ? t('Не получилось спросить GitHub', 'Could not reach GitHub', '无法连接 GitHub') : release.value?.tag || release.value?.name || '')
const meta = computed(() => {
  if (!loaded.value) return t('Спрашиваем GitHub…', 'Asking GitHub…', '正在询问 GitHub……')
  if (failure.value === 'rate') return t('GitHub временно ограничил запросы с вашего адреса. Файлы — на странице релизов.', 'GitHub temporarily limited requests from your address. Files are on the releases page.', 'GitHub 暂时限制了来自你的地址的请求。文件可在发行版页面获取。')
  if (failure.value === 'none') return t('Первый релиз появится на странице релизов GitHub.', 'The first release will appear on the GitHub releases page.', '第一个发行版将出现在 GitHub 发行版页面。')
  if (failure.value) return t('Нет связи с GitHub. Файлы всегда есть на странице релизов.', 'Could not reach GitHub. Files are always on the releases page.', '无法连接 GitHub。文件始终可在发行版页面获取。')
  return `${release.value?.prerelease ? t('Предварительный релиз · ', 'Prerelease · ', '预发行版 · ') : ''}${date.value}`
})

// Magnet groups belong to the page's motion scope; a new scope (another route) needs new groups.
let magnet: { select: (element: Element | null) => void } | undefined
let magnetScope: PageMotion | undefined
function mountGroups() {
  const runtime = motion.value
  if (!runtime || runtime === magnetScope || !loaded.value || !oses.value.length || !tabs.value || !list.value) return
  magnetScope = runtime
  magnet = runtime.M.magnetGroup(tabs.value, { items: 'button', sticky: true, contentPull: 0 })
  runtime.M.magnetGroup(list.value, { items: '.asset', contentPull: 0 })
  runtime.scope.frame(() => magnet?.select(tabs.value?.querySelector(`[data-os="${current.value}"]`) ?? null))
}
function select(os: OS, event: Event) { chosen.value = os; magnet?.select(event.currentTarget as Element) }
watch([motion, loaded], () => nextTick(mountGroups))

// The motion runtime reveals the root by adding `is-in` to its classList. Vue must never patch that
// node's class (a class binding would drop `is-in` and hide the block), so its state is in attributes.
let disposed = false
onMounted(async () => {
  const me = await detect()
  if (!disposed) detected.value = me
})
onBeforeUnmount(() => { disposed = true })
</script>

<template>
  <div id="release" class="rel" data-fade :aria-busy="!loaded" :data-state="!loaded ? 'loading' : failure ? 'error' : 'ready'">
    <div class="rel-top">
      <div><div class="rel-ver"><span v-if="!loaded" class="skel" style="display:block;width:160px;height:30px" /><template v-else>{{ heading }}</template></div>
        <div class="rel-meta">{{ meta }}</div>
      </div>
      <div class="row"><a class="btn btn-ghost btn-s" data-rel-link :href="release?.url || 'https://github.com/Hoxiee/ReClash/releases'">{{ t('Все релизы', 'All releases', '全部发行版') }}</a><a class="btn btn-ghost btn-s" href="https://github.com/Hoxiee/ReClash">GitHub</a></div>
    </div>
    <div class="pick" :hidden="!best">
      <span class="os" aria-hidden="true">{{ best ? osShort[best.os] : '' }}</span>
      <div><span class="rel-meta">{{ t('Подходит для вашего устройства', 'Recommended for your device', '推荐用于你的设备') }}</span><b>{{ best ? `${osNames[best.os]} · ${kind(best.kind)}${best.arch ? ` · ${best.arch}` : ''}` : '' }}</b><small>{{ best ? `${best.name} · ${size(best.size)}${detected?.os === 'macos' && !detected.arch ? t(' · проверьте, Apple silicon у вас или Intel', ' · check whether your Mac uses Apple silicon or Intel', ' · 请确认你的 Mac 使用的是 Apple silicon 还是 Intel') : ''}` : '' }}</small></div>
      <a class="btn btn-primary" :href="best?.url || '#'">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ t('Скачать', 'Download', '下载') }}
      </a>
    </div>
    <p class="rel-empty" :hidden="!loaded || !!failure || (!!oses.length && detected?.os !== 'ios')">{{ !oses.length ? t('В последнем релизе нет файлов сборок — загляните на страницу релизов.', 'The latest release contains no build files. Check the releases page.', '最新发行版中没有构建文件。请查看发行版页面。') : t('Похоже, вы на iPhone или iPad — сборки для iOS нет. Ниже файлы для других систем.', 'You seem to be using an iPhone or iPad. There is no iOS build; files for other systems are below.', '你似乎在使用 iPhone 或 iPad。没有 iOS 版本；下方是适用于其他系统的文件。') }}</p>
    <div ref="tabs" class="plat-tabs" role="group" :aria-label="t('Платформа', 'Platform', '平台')" :hidden="!loaded || !oses.length"><button v-for="os in oses" :key="os" type="button" :data-os="os" :aria-pressed="current === os" @click="select(os, $event)">{{ osNames[os] }}</button></div>
    <ul ref="list" class="assets" aria-live="polite" :hidden="loaded && !!failure">
      <template v-if="!loaded"><li v-for="width in ['70%', '55%', '62%']" :key="width" class="asset"><span class="skel" :style="{ width }" /></li></template>
      <template v-else-if="!failure"><li v-for="(asset, index) in assets" :key="asset.name"><a class="asset asset-anim" data-mg :style="`--i:${index}`" :href="asset.url"><span class="n">{{ asset.name }}</span><span class="k">{{ kind(asset.kind) }}{{ asset.arch ? ` · ${asset.arch}` : '' }}</span><span class="s">{{ size(asset.size) }}</span><svg class="dl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" /></svg></a></li></template>
    </ul>
    <p class="rel-meta">{{ t('Платформа определяется по браузеру и может ошибаться — полный список файлов всегда здесь.', 'The platform is detected from your browser and may be wrong. The full file list is always here.', '平台是根据浏览器检测的，可能不准确。完整文件列表始终在这里。') }}</p>
  </div>
</template>
