<script setup lang="ts">
import { classify, detect, score } from '~~/shared/site/releases'
const { language, t } = useText()
const motion = usePageMotion()
const tabs = useTemplateRef<HTMLElement>('tabs'), list = useTemplateRef<HTMLElement>('list')
const osNames = { windows: 'Windows', macos: 'macOS', linux: 'Linux', android: 'Android' } as const
const osShort = { windows: 'W', macos: 'M', linux: 'L', android: 'A' }
type OS = keyof typeof osNames
type Asset = { os: OS, arch: string, kind: string, name: string, size: number, url: string }
type Release = { tag_name?: string, name: string, prerelease: boolean, published_at: string, html_url: string, assets: Array<{ name: string, size: number, browser_download_url: string }> }
const release = shallowRef<Release>(), groups = ref<Partial<Record<OS, Asset[]>>>({}), current = ref<OS>('windows')
const best = shallowRef<Asset>(), detected = ref<{ os: string | null, arch: string }>(), loaded = ref(false), failure = ref('')
const controller = new AbortController()
const oses = computed(() => (Object.keys(osNames) as OS[]).filter(os => groups.value[os]))
const assets = computed(() => groups.value[current.value] || [])
const kind = (value: string) => ({ Installer: t('Установщик', 'Installer'), Program: t('Программа', 'Program'), 'Portable ZIP': t('Портативный ZIP', 'Portable ZIP'), File: t('Файл', 'File') })[value] || value
const size = (bytes: number) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1).replace('.', t(',', '.'))} ${t('МБ', 'MB')}` : `${Math.round(bytes / 1024)} ${t('КБ', 'KB')}`
const date = computed(() => release.value ? new Date(release.value.published_at).toLocaleDateString(language.value === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
let magnet: { select: (element: Element | null) => void } | undefined
function mountGroups() {
  const runtime = motion.value
  if (!runtime || !loaded.value || !oses.value.length || !tabs.value || magnet) return
  magnet = runtime.M.magnetGroup(tabs.value, { items: 'button', sticky: true, pull: 0, contentPull: 0 })
  runtime.M.magnetGroup(list.value!, { items: '.asset', pull: .03, contentPull: 0 })
  runtime.scope.frame(() => magnet?.select(tabs.value!.querySelector(`[data-os="${current.value}"]`)))
}
function select(os: OS, event: Event) { current.value = os; magnet?.select(event.currentTarget as Element) }
async function load(): Promise<Release> {
  const key = 'reclash-release'
  try { const cached = JSON.parse(sessionStorage.getItem(key) || 'null'); if (cached && Date.now() - cached.at < 600000) return cached.data } catch { /* Storage is optional. */ }
  let response = await fetch('https://api.github.com/repos/Hoxiee/ReClash/releases/latest', { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal })
  let data: Release
  if (response.status === 404) {
    response = await fetch('https://api.github.com/repos/Hoxiee/ReClash/releases?per_page=1', { signal: controller.signal })
    if (!response.ok) throw new Error(response.status === 403 ? 'rate' : 'http')
    const releases: Release[] = await response.json()
    if (!releases.length) throw new Error('none')
    data = releases[0]!
  } else {
    if (!response.ok) throw new Error(response.status === 403 ? 'rate' : 'http')
    data = await response.json()
  }
  if (controller.signal.aborted) throw new Error('aborted')
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })) } catch { /* Storage is optional. */ }
  return data
}
watch(motion, mountGroups)
onMounted(async () => {
  try {
    const [data, me] = await Promise.all([load(), detect()])
    if (controller.signal.aborted) return
    release.value = data; detected.value = me
    for (const asset of data.assets || []) {
      const c = classify(asset.name)
      if (!c) continue
      const os = c.os as OS
      ;(groups.value[os] ||= []).push({ ...c, os, name: asset.name, size: asset.size, url: asset.browser_download_url })
    }
    if (me.os && me.os in groups.value) best.value = groups.value[me.os as OS]?.slice().sort((a, b) => score(b, me) - score(a, me))[0]
    current.value = best.value?.os || oses.value[0] || 'windows'
  } catch (error) { if (!controller.signal.aborted) failure.value = error instanceof Error ? error.message : 'http' }
  finally { if (!controller.signal.aborted) { loaded.value = true; await nextTick(); mountGroups() } }
})
onBeforeUnmount(() => controller.abort())
</script>

<template>
  <div id="release" class="rel" :class="{ 'is-loaded': loaded }" data-fade>
    <div class="rel-top">
      <div><div class="rel-ver"><span v-if="!loaded" class="skel" style="display:block;width:160px;height:30px" /><template v-else>{{ failure ? t('Не получилось спросить GitHub', 'Could not reach GitHub') : release?.tag_name || release?.name }}</template></div>
        <div class="rel-meta">{{ !loaded ? t('Спрашиваем GitHub…', 'Asking GitHub…') : failure ? failure === 'rate' ? t('GitHub временно ограничил запросы с вашего адреса. Файлы — на странице релизов.', 'GitHub temporarily limited requests from your address. Files are on the releases page.') : t('Нет связи с GitHub. Файлы всегда есть на странице релизов.', 'Could not reach GitHub. Files are always on the releases page.') : `${release?.prerelease ? t('Предварительный релиз · ', 'Prerelease · ') : ''}${date}` }}</div>
      </div>
      <div class="row"><a class="btn btn-ghost btn-s" data-rel-link :href="release?.html_url || 'https://github.com/Hoxiee/ReClash/releases'">{{ t('Все релизы', 'All releases') }}</a><a class="btn btn-ghost btn-s" href="https://github.com/Hoxiee/ReClash">GitHub</a></div>
    </div>
    <div class="pick" :hidden="!best">
      <span class="os" aria-hidden="true">{{ best ? osShort[best.os] : '' }}</span>
      <div><span class="rel-meta">{{ t('Подходит для вашего устройства', 'Recommended for your device') }}</span><b>{{ best ? `${osNames[best.os]} · ${kind(best.kind)}${best.arch ? ` · ${best.arch}` : ''}` : '' }}</b><small>{{ best ? `${best.name} · ${size(best.size)}${detected?.os === 'macos' && !detected.arch ? t(' · проверьте, Apple silicon у вас или Intel', ' · check whether your Mac uses Apple silicon or Intel') : ''}` : '' }}</small></div>
      <a class="btn btn-primary" :href="best?.url || '#'">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ t('Скачать', 'Download') }}
      </a>
    </div>
    <p class="rel-empty" :hidden="!loaded || !!failure || (!!oses.length && detected?.os !== 'ios')">{{ !oses.length ? t('В последнем релизе нет файлов сборок — загляните на страницу релизов.', 'The latest release contains no build files. Check the releases page.') : t('Похоже, вы на iPhone или iPad — сборки для iOS нет. Ниже файлы для других систем.', 'You seem to be using an iPhone or iPad. There is no iOS build; files for other systems are below.') }}</p>
    <div ref="tabs" class="plat-tabs" role="group" :aria-label="t('Платформа', 'Platform')" :hidden="!oses.length"><button v-for="os in oses" :key="os" type="button" :data-os="os" :aria-pressed="current === os" @click="select(os, $event)">{{ osNames[os] }}</button></div>
    <ul ref="list" class="assets" aria-live="polite">
      <template v-if="!loaded || (!failure && !oses.length)"><li v-for="width in ['70%', '55%', '62%']" :key="width" class="asset"><span class="skel" :style="{ width }" /></li></template>
      <template v-else-if="!failure"><li v-for="(asset, index) in assets" :key="asset.name"><a class="asset asset-anim" data-mg :style="`--i:${index}`" :href="asset.url"><span class="n">{{ asset.name }}</span><span class="k">{{ kind(asset.kind) }}{{ asset.arch ? ` · ${asset.arch}` : '' }}</span><span class="s">{{ size(asset.size) }}</span></a></li></template>
    </ul>
    <p class="rel-meta">{{ t('Платформа определяется по браузеру и может ошибаться — полный список файлов всегда здесь.', 'The platform is detected from your browser and may be wrong. The full file list is always here.') }}</p>
  </div>
</template>
