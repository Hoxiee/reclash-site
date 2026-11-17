<script setup lang="ts">
import { mockBody, mockConfig, mockConfigPath, mockHeaders, mockPath, mockTransportHeaders, type MockProfile } from '~~/shared/provider/mocks'
import { lineCount } from './view'

// The exact response of one stand, split into what the client reads: headers, the hosted manifest and the profile body.
const props = defineProps<{ profile: MockProfile, origin: string, now: number }>()
const { t } = useText()

const headers = computed(() => [
  ...mockTransportHeaders.map(([key, value]) => ({ key, value, kind: 'host' })),
  ...mockHeaders(props.profile, props.origin, props.now).map(([key, value]) => ({
    key, value, kind: key.startsWith('ReClash-') || key === 'reclash-config' ? 'reclash' : 'common',
  })),
])
const config = computed(() => mockConfig(props.profile, props.origin, props.now))
const body = computed(() => mockBody(props.profile))
const configUrl = computed(() => props.origin + mockConfigPath(props.profile.key))

const tabs = computed(() => [
  { id: 'config', label: 'reclash-config', meta: config.value ? String(lineCount(config.value)) : t('нет', 'none'), empty: !config.value },
  { id: 'body', label: t('Тело', 'Body'), meta: String(lineCount(body.value)), empty: false },
  { id: 'headers', label: t('Заголовки', 'Headers'), meta: String(headers.value.length), empty: false },
])
const active = ref(config.value ? 'config' : 'body')
const buttons = ref<HTMLButtonElement[]>([])
const uid = computed(() => `mock-${props.profile.key}-insp`)
const tablist = useTemplateRef<HTMLElement>('tablist')
const pill = ref<{ x: number, y: number, w: number, h: number }>()

function measure() {
  const button = buttons.value.find(item => item.dataset.tab === active.value)
  if (button) pill.value = { x: button.offsetLeft, y: button.offsetTop, w: button.offsetWidth, h: button.offsetHeight }
}
let observer: ResizeObserver | undefined
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  if (tablist.value) observer.observe(tablist.value)
})
onBeforeUnmount(() => observer?.disconnect())
watch(active, () => nextTick(measure))

function keys(event: KeyboardEvent) {
  const index = tabs.value.findIndex(tab => tab.id === active.value)
  const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1
    : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.value.length - 1 : -1
  if (next < 0) return
  event.preventDefault()
  const target = tabs.value[(next + tabs.value.length) % tabs.value.length]!
  active.value = target.id
  nextTick(() => buttons.value.find(button => button.dataset.tab === target.id)?.focus())
}
</script>

<template>
  <div class="mock-insp">
    <div ref="tablist" class="mock-insp-tabs" :class="{ 'has-pill': pill }" role="tablist" :aria-label="t('Ответ стенда', 'Stand response')" @keydown="keys">
      <span v-if="pill" class="mock-insp-pill" :style="{ translate: `${pill.x}px ${pill.y}px`, width: `${pill.w}px`, height: `${pill.h}px` }" aria-hidden="true" />
      <button
        v-for="tab in tabs"
        :id="`${uid}-tab-${tab.id}`"
        :key="tab.id"
        ref="buttons"
        type="button"
        role="tab"
        class="mock-insp-tab"
        :class="{ 'is-empty': tab.empty }"
        :data-tab="tab.id"
        :aria-selected="active === tab.id"
        :aria-controls="`${uid}-panel-${tab.id}`"
        :tabindex="active === tab.id ? 0 : -1"
        @click="active = tab.id"
      >
        <span class="mock-insp-name" :class="{ 'is-code': tab.id === 'config' }">{{ tab.label }}</span>
        <span class="mock-insp-n">{{ tab.meta }}</span>
      </button>
    </div>

    <div :id="`${uid}-panel-headers`" role="tabpanel" tabindex="0" :aria-labelledby="`${uid}-tab-headers`" :hidden="active !== 'headers'">
      <dl v-if="active === 'headers'" class="mock-hdr-list">
        <div v-for="header in headers" :key="header.key" class="mock-hdr" :class="`is-${header.kind}`">
          <dt>{{ header.key }}</dt>
          <dd>{{ header.value }}</dd>
        </div>
      </dl>
    </div>

    <div :id="`${uid}-panel-config`" role="tabpanel" tabindex="0" :aria-labelledby="`${uid}-tab-config`" :hidden="active !== 'config'">
      <template v-if="active === 'config'">
        <template v-if="config">
          <p class="mock-insp-cap">
            <span>{{ t('Манифест из заголовка', 'Manifest from the') }} <code>reclash-config</code></span>
            <a class="tlink" :href="mockConfigPath(profile.key)" target="_blank" rel="noopener">{{ configUrl }}</a>
          </p>
          <CodeBlock :code="config" :label="`${profile.key}.yaml`" lang="yaml" />
        </template>
        <p v-else class="mock-insp-none">
          <b>{{ t('У этого стенда нет манифеста.', 'This stand has no manifest.') }}</b>
          {{ t('Ответ без заголовка reclash-config: название берётся из Profile-Title, оформление остаётся стандартным.', 'The response has no reclash-config header: the name comes from Profile-Title and the look stays default.') }}
        </p>
      </template>
    </div>

    <div :id="`${uid}-panel-body`" role="tabpanel" tabindex="0" :aria-labelledby="`${uid}-tab-body`" :hidden="active !== 'body'">
      <template v-if="active === 'body'">
        <p class="mock-insp-cap">
          <span>{{ t('Профиль mihomo, который клиент устанавливает', 'The mihomo profile the client installs') }}</span>
          <a class="tlink" :href="mockPath(profile.key)" target="_blank" rel="noopener">{{ origin + mockPath(profile.key) }}</a>
        </p>
        <CodeBlock :code="body" :label="`${profile.key}.yaml`" lang="yaml" />
      </template>
    </div>
  </div>
</template>
