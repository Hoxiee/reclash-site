<script setup lang="ts">
import { parseMarkdown, type MdDocument } from '~~/shared/site/markdown'
import { RELEASE_REPO, RELEASES_PAGE, releaseDate, type ReleaseInfo } from '~~/shared/site/releases'
import type { ReleaseFeed } from '~/composables/useReleases'
// Changelog for the download page: the current release's notes and an accordion of the others.
const props = defineProps<{ feed: ReleaseFeed }>()
const { language, t } = useText()
const motion = usePageMotion()

const current = computed(() => props.feed.status === 'ready' ? props.feed.current : undefined)
const others = computed(() => props.feed.status === 'ready' ? props.feed.releases.filter(release => release !== current.value) : [])
const newerPrerelease = computed(() => props.feed.status === 'ready' && props.feed.releases[0] !== current.value)
const open = reactive<Record<number, boolean>>({})
const seen = reactive<Record<number, boolean>>({})

// Bodies are parsed once and only when shown; the parser caps their length and node count.
const parsed = new Map<ReleaseInfo, MdDocument>()
function notes(release: ReleaseInfo) {
  let doc = parsed.get(release)
  if (!doc) parsed.set(release, doc = parseMarkdown(release.body, { repo: RELEASE_REPO }))
  return doc
}
const date = (release: ReleaseInfo) => releaseDate(release.published, language.value)
const version = (release: ReleaseInfo) => release.tag || release.name

const fallbackEase = 'cubic-bezier(0.22, 1, 0.36, 1)'
const running = new WeakMap<HTMLElement, Animation>()
async function toggle(key: number, event: Event) {
  const panel = (event.currentTarget as HTMLElement).closest('.cl-item')?.querySelector<HTMLElement>('.cl-panel')
  if (!panel) return
  const from = panel.getBoundingClientRect().height
  running.get(panel)?.cancel()
  open[key] = !open[key]
  seen[key] = true
  const runtime = motion.value
  if (!runtime || runtime.M.reduced) return
  await nextTick()
  if (runtime.scope.disposed) return
  const to = panel.getBoundingClientRect().height
  if (Math.abs(to - from) < 1) return
  // The panel's final height comes from CSS; the animation only bridges to it, keeping the content
  // visible while it closes. Browsers without linear() easing get the site's smooth curve.
  const ease = runtime.M.cssEase('smooth')
  const easing = globalThis.CSS?.supports?.('transition-timing-function', ease.easing) ? ease.easing : fallbackEase
  try {
    const animation = runtime.scope.animate(panel, [{ height: `${from}px`, visibility: 'visible' }, { height: `${to}px`, visibility: 'visible' }], { duration: ease.duration, easing })
    if (animation) running.set(panel, animation)
  } catch { /* An unsupported animation leaves the final state in place. */ }
}
</script>

<template>
  <div class="cl" :aria-busy="feed.status === 'loading'">
    <div v-if="feed.status === 'loading'" class="cl-card" aria-hidden="true">
      <div class="cl-head"><span class="skel" style="width:120px;height:26px" /></div>
      <div class="cl-skel"><span class="skel" style="width:40%" /><span class="skel" style="width:86%" /><span class="skel" style="width:72%" /><span class="skel" style="width:58%" /></div>
    </div>

    <div v-else-if="feed.status === 'error'" class="cl-card cl-fail cl-in">
      <p>{{ feed.failure === 'none' ? t('Релизов пока нет — заметки появятся вместе с первым.', 'No releases yet. Notes will appear with the first one.') : t('Не получилось загрузить заметки к релизам. Они всегда есть на GitHub.', 'Could not load the release notes. They are always on GitHub.') }}</p>
      <a class="btn btn-ghost btn-s" :href="RELEASES_PAGE" target="_blank" rel="noopener noreferrer">{{ t('Релизы на GitHub', 'Releases on GitHub') }}</a>
    </div>

    <template v-else-if="current">
      <article class="cl-card cl-in" aria-labelledby="cl-current">
        <header class="cl-head">
          <h3 id="cl-current" class="cl-ver">{{ version(current) }}</h3>
          <span class="cl-badge" :class="{ 'is-pre': current.prerelease }">{{ current.prerelease ? t('Предварительный', 'Prerelease') : t('Актуальный', 'Latest') }}</span>
          <time class="cl-date" :datetime="current.published">{{ date(current) }}</time>
          <a class="btn btn-ghost btn-s cl-gh" :href="current.url" target="_blank" rel="noopener noreferrer">{{ t('На GitHub', 'On GitHub') }}</a>
        </header>
        <div v-if="notes(current).blocks.length" class="md"><ReleaseMarkdown :blocks="notes(current).blocks" :level="4" /></div>
        <p v-else class="cl-empty">{{ t('К этому релизу нет заметок.', 'No notes for this release.') }}</p>
        <p v-if="notes(current).truncated" class="cl-more"><a class="tlink" :href="current.url" target="_blank" rel="noopener noreferrer">{{ t('Заметки сокращены — полный текст на GitHub', 'The notes are shortened. Read them in full on GitHub') }}</a></p>
      </article>

      <template v-if="others.length">
        <h3 class="cl-sub">{{ newerPrerelease ? t('Другие релизы', 'Other releases') : t('Предыдущие релизы', 'Earlier releases') }}</h3>
        <ul class="cl-list">
          <li v-for="(release, index) in others" :key="index" class="cl-item cl-in" :data-open="open[index] ? '' : undefined" :style="`--i:${index}`">
            <h4 class="cl-row">
              <button :id="`cl-b-${index}`" class="cl-btn" type="button" :aria-expanded="!!open[index]" :aria-controls="`cl-p-${index}`" @click="toggle(index, $event)">
                <span class="cl-v">{{ version(release) }}</span>
                <span v-if="release.prerelease" class="cl-badge is-pre">{{ t('Предварительный', 'Prerelease') }}</span>
                <time class="cl-date" :datetime="release.published">{{ date(release) }}</time>
                <span class="pm" aria-hidden="true" />
              </button>
            </h4>
            <div :id="`cl-p-${index}`" class="cl-panel" role="region" :aria-labelledby="`cl-b-${index}`">
              <div v-if="seen[index]" class="cl-body">
                <div v-if="notes(release).blocks.length" class="md"><ReleaseMarkdown :blocks="notes(release).blocks" :level="5" /></div>
                <p v-else class="cl-empty">{{ t('К этому релизу нет заметок.', 'No notes for this release.') }}</p>
                <p class="cl-more"><a class="tlink" :href="release.url" target="_blank" rel="noopener noreferrer">{{ notes(release).truncated ? t('Заметки сокращены — полный текст на GitHub', 'The notes are shortened. Read them in full on GitHub') : t('Релиз на GitHub', 'This release on GitHub') }}</a></p>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>
