<script setup lang="ts">
import { mockBody, mockHeaders, mockImportLink, mockTransportHeaders, mockUrl, type MockProfile } from '~~/shared/provider/mocks'
import { mockFacts } from '~~/shared/provider/mockview'

// One mock subscription: what it teaches, how to import it, and the exact response it serves.
const props = defineProps<{ profile: MockProfile, index: number, origin: string, now: number }>()
const { language, t } = useText()

const url = computed(() => mockUrl(props.origin, props.profile.key))
const importLink = computed(() => mockImportLink(props.origin, props.profile.key))
const facts = computed(() => mockFacts(props.profile, props.now, language.value))
const headers = computed(() => [
  ...mockTransportHeaders.map(([key, value]) => ({ key, value, kind: 'host' })),
  ...mockHeaders(props.profile, props.origin, props.now).map(([key, value]) => ({
    key, value, kind: key.startsWith('ReClash-') ? 'reclash' : key.startsWith('X-Hwid-') ? 'service' : 'common',
  })),
])
const body = computed(() => mockBody(props.profile))
const bodyLines = computed(() => {
  const count = body.value.trimEnd().split('\n').length
  const mod10 = count % 10, mod100 = count % 100
  const ru = mod10 === 1 && mod100 !== 11 ? 'строка' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'строки' : 'строк'
  return t(`${count} ${ru}`, `${count} lines`)
})
const number = computed(() => String(props.index + 1).padStart(2, '0'))
const tone = computed(() => props.profile.tone === 'themed'
  ? t('Оформление', 'Theming')
  : props.profile.tone === 'warn' ? t('Предупреждение', 'Warning') : '')
</script>

<template>
  <article :id="`mock-${profile.key}`" class="mock-stand" :class="profile.tone && `is-${profile.tone}`" :aria-labelledby="`mock-${profile.key}-name`">
    <header class="mock-stand-head" data-fade>
      <p class="mock-stand-meta">
        <span class="mock-stand-n">{{ number }}</span>
        <code>/mock/{{ profile.key }}</code>
        <span v-if="tone" class="mock-stand-tone">{{ tone }}</span>
      </p>
      <h3 :id="`mock-${profile.key}-name`" class="mock-stand-name" tabindex="-1">{{ profile.name[language] }}</h3>
      <p class="mock-stand-blurb">{{ profile.blurb[language] }}</p>
    </header>

    <div class="mock-stand-pv" data-fade style="--d:80ms">
      <MockPreview :profile="profile" :now="now" />
    </div>

    <div class="mock-stand-body">
      <p class="mock-stand-teaches" data-fade>{{ profile.teaches[language] }}</p>

      <dl class="mock-facts" data-fade>
        <div><dt>{{ t('Трафик', 'Traffic') }}</dt><dd>{{ facts.traffic }}</dd></div>
        <div><dt>{{ t('Срок', 'Expires') }}</dt><dd>{{ facts.expires }}</dd></div>
        <div><dt>{{ t('Узлов', 'Nodes') }}</dt><dd>{{ facts.nodes }}</dd></div>
        <div><dt>{{ t('Обновление', 'Refresh') }}</dt><dd>{{ facts.refresh }}</dd></div>
      </dl>

      <div class="mock-acts" data-fade>
        <SiteLink class="btn btn-primary btn-s" :to="importLink">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <span>{{ t('Импорт в ReClash', 'Import into ReClash') }}</span>
        </SiteLink>
        <span class="mock-deeplink"><code>{{ importLink }}</code></span>
      </div>

      <div class="mock-url" data-fade>
        <CodeBlock :code="url" :label="t('Ссылка на подписку', 'Subscription URL')" />
      </div>

      <div class="mock-hdrs" data-fade>
        <p class="mock-hdrs-cap">
          <span>{{ t('Заголовки ответа', 'Response headers') }}</span>
          <span>{{ headers.length }}</span>
        </p>
        <dl class="mock-hdr-list">
          <div v-for="header in headers" :key="header.key" class="mock-hdr" :class="`is-${header.kind}`">
            <dt>{{ header.key }}</dt>
            <dd>{{ header.value }}</dd>
          </div>
        </dl>
      </div>

      <details class="mock-yaml" data-fade>
        <summary>
          <span>{{ t('Тело профиля', 'Profile body') }}</span>
          <span class="mock-yaml-meta">YAML · {{ bodyLines }}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </summary>
        <CodeBlock :code="body" :label="`${profile.key}.yaml`" />
      </details>
    </div>
  </article>
</template>
