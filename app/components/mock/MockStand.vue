<script setup lang="ts">
import { mockImportLink, mockUrl, type MockProfile } from '~~/shared/provider/mocks'
import { mockTheme } from '~~/shared/provider/mockview'

// One mock subscription: what to check in the client, how to import it, and the exact response it serves.
const props = defineProps<{ profile: MockProfile, index: number, total: number, origin: string, now: number }>()
const { language, t } = useToolText()

const theme = computed(() => mockTheme(props.profile))
const url = computed(() => mockUrl(props.origin, props.profile.key))
const importLink = computed(() => mockImportLink(props.origin, props.profile.key))
const number = computed(() => `${String(props.index + 1).padStart(2, '0')} / ${String(props.total).padStart(2, '0')}`)
const checks = computed(() => props.profile.teaches[language.value].split(/(?<=[.!?])\s+(?=[A-ZА-ЯЁ])/))
</script>

<template>
  <article :id="`mock-${profile.key}`" class="mock-stand" :class="profile.tone && `is-${profile.tone}`" :aria-labelledby="`mock-${profile.key}-name`">
    <header class="mock-stand-head">
      <div class="mock-stand-title">
        <p class="mock-stand-meta">
          <span class="mock-stand-n">{{ number }}</span>
          <span class="mock-stand-tone">{{ profile.scenario[language] }}</span>
          <code>/mock/{{ profile.key }}</code>
        </p>
        <h2 :id="`mock-${profile.key}-name`" class="mock-stand-name" tabindex="-1">
          <span class="mock-swatch" :class="{ 'is-stock': !theme.seed }" :style="theme.style" aria-hidden="true" />
          <span class="mock-stand-label">{{ profile.name[language] }}</span>
        </h2>
        <p class="mock-stand-blurb">{{ profile.blurb[language] }}</p>
      </div>
      <div class="mock-acts">
        <SiteLink class="btn btn-primary btn-s" :to="importLink">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <span>{{ t('Импорт в ReClash', 'Import into ReClash') }}</span>
        </SiteLink>
        <MockBuilderLink :profile="profile" :origin="origin" :now="now" />
      </div>
      <div class="mock-url">
        <CodeBlock :code="url" :label="t('Ссылка на подписку', 'Subscription URL')" />
      </div>
    </header>

    <div class="mock-stand-stage">
      <div class="mock-stand-pv">
        <MockPreview :profile="profile" :now="now" />
      </div>
      <div class="mock-stand-body">
        <section class="mock-check">
          <h3 class="mock-sub-h">{{ t('Что проверить в клиенте', 'What to check in the client') }}</h3>
          <ul>
            <li v-for="(check, i) in checks" :key="i" :style="{ '--i': i }">{{ check }}</li>
          </ul>
        </section>
        <section>
          <h3 class="mock-sub-h">{{ t('Что отдаёт сервер', 'What the server returns') }}</h3>
          <p class="mock-resp-hint">{{ t('reclash-config — манифест оформления по ссылке из заголовка. Тело — YAML с узлами. Заголовки — HTTP-ответ на запрос подписки.', 'reclash-config is the branding manifest linked from a header. Body is the YAML with nodes. Headers are the HTTP response to the subscription request.') }}</p>
          <MockInspector :profile="profile" :origin="origin" :now="now" />
        </section>
      </div>
    </div>
  </article>
</template>
