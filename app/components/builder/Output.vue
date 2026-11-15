<script setup lang="ts">
import { docPath } from '~~/shared/docs/catalogue'
import { manifestLimit, schemaCommentLine } from '~~/shared/provider/builder/document'
import { caddySnippet, defaultGlobalFilter, exampleManifestUrl, globalGroup, headerLine, isHttpsUrl, nginxSnippet, remnawaveRule, tunExclusions } from '~~/shared/provider/builder/deploy'
import type { CodeLanguage } from '~~/shared/site/highlight'
import type { KernelView } from '~/composables/useBuilder'

// Plain props and change handlers instead of defineModel and v-model on checkboxes: those Vue helpers
// would land in the shared runtime chunk and grow every route's initial JS.
const props = defineProps<{ yaml: string, kernel: KernelView, routing: boolean, url: string }>()
const emit = defineEmits<{ 'update:url': [value: string], retry: [] }>()
const url = computed(() => props.url)
const checked = (event: Event) => (event.target as HTMLInputElement).checked
const { language, t } = useText()
const { get } = useBuilder()

const schemaComment = ref(false)
const text = computed(() => (schemaComment.value ? `${schemaCommentLine}\n` : '') + props.yaml)
const bytes = computed(() => new TextEncoder().encode(text.value).length)
const share = computed(() => Math.min(1, bytes.value / manifestLimit))
const sizeText = computed(() => bytes.value < 1024 ? `${bytes.value} B` : `${(bytes.value / 1024).toFixed(1)} KiB`)
const empty = computed(() => props.yaml.trim() === 'version: 1')

function download() {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([text.value], { type: 'application/yaml' }))
  link.download = 'reclash.yaml'
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 0)
}

const target = computed(() => url.value.trim() || exampleManifestUrl)
const urlProblem = computed(() => url.value.trim() && !isHttpsUrl(url.value.trim()) ? t('Нужна ссылка https://. Заголовок с другой схемой не учитывается.', 'Use an https:// link. Any other scheme is ignored.') : '')
type Tab = 'header' | 'nginx' | 'caddy' | 'remnawave'
const tab = ref<Tab>('header')
const tabs: Array<{ key: Tab, text: string }> = [{ key: 'header', text: 'HTTP' }, { key: 'nginx', text: 'nginx' }, { key: 'caddy', text: 'Caddy' }, { key: 'remnawave', text: 'Remnawave' }]
const snippet = computed<{ code: string, lang: CodeLanguage, label: string }>(() => ({
  header: { code: headerLine(target.value), lang: 'http' as const, label: t('Заголовок ответа подписки', 'Subscription response header') },
  nginx: { code: nginxSnippet(target.value), lang: 'nginx' as const, label: t('location подписки', 'Subscription location') },
  caddy: { code: caddySnippet(target.value), lang: 'text' as const, label: 'Caddyfile' },
  remnawave: { code: remnawaveRule(target.value), lang: 'text' as const, label: t('Subscription → Response Rules', 'Subscription → Response Rules') },
})[tab.value])

const listed = computed(() => get('policy.global') === 'listed')
const required = computed(() => get('policy.apps') === 'required')
const remnawave = ref(true)
const filter = ref(defaultGlobalFilter)
const packages = computed(() => {
  const list = get('apps.exclude')
  return (Array.isArray(list) ? list : []).filter((item): item is string => typeof item === 'string' && /^[\w.]+$/.test(item))
})
</script>

<template>
  <div class="bout">
    <section class="bpanel" aria-labelledby="bout-verdict">
      <h3 id="bout-verdict" class="bpanel-h">{{ t('Как ReClash прочтёт файл', 'How ReClash reads this file') }}</h3>
      <div v-if="kernel.state === 'done'" class="verdict bverdict" :class="kernel.result.ok ? (kernel.result.warnings.length ? 'is-warn' : 'ok') : 'bad'" :aria-busy="kernel.stale" role="status" data-test="verdict">
        <span class="vi" aria-hidden="true">
          <svg v-if="!kernel.result.ok" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" /></svg>
          <svg v-else-if="kernel.result.warnings.length" viewBox="0 0 24 24"><path d="M12 7v6m0 4v.1" /></svg>
          <svg v-else viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <div>
          <b v-if="!kernel.result.ok">{{ t('Файл отклонён целиком', 'The whole file is rejected') }}</b>
          <b v-else-if="kernel.result.warnings.length">{{ t(`Принят, предупреждений: ${kernel.result.warnings.length}`, `Accepted with ${kernel.result.warnings.length} warning${kernel.result.warnings.length === 1 ? '' : 's'}`) }}</b>
          <b v-else>{{ t('Принят без предупреждений', 'Accepted without warnings') }}</b>
          <p class="bverdict-sub">{{ kernel.result.ok ? t('Так же их покажет инспектор подписки. Текст — от парсера приложения, без перевода.', 'The Subscription inspector shows the same. The text comes from the app parser, untranslated.') : t('Приложение не применит ни одного раздела, пока файл не исправлен.', 'The app applies no section until the file is fixed.') }}</p>
          <ul v-if="kernel.result.warnings.length" class="bwarn">
            <li v-for="(warning, index) in kernel.result.warnings" :key="index"><code>{{ warning }}</code></li>
          </ul>
        </div>
      </div>
      <p v-else class="note bverdict-wait" role="status">
        <span v-if="kernel.state === 'loading'" class="bspin" aria-hidden="true" />
        <svg v-else viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M10 6.5v4m0 3v.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
        <span>{{ kernel.state === 'unavailable' ? t('Парсер приложения не загрузился. Поля всё равно проверяются по схеме.', 'The app parser did not load. Fields are still checked against the schema.') : kernel.state === 'idle' ? t('Парсер приложения подключится после первой правки или импорта.', 'The app parser loads after your first edit or import.') : t('Загружаем парсер приложения…', 'Loading the app parser…') }}</span>
        <button v-if="kernel.state === 'unavailable'" type="button" class="blink" @click="emit('retry')">{{ t('Повторить проверку', 'Retry the check') }}</button>
      </p>
    </section>

    <section class="bpanel" aria-labelledby="bout-file">
      <div class="bpanel-row">
        <h3 id="bout-file" class="bpanel-h">reclash.yaml</h3>
        <label class="bcheck"><input :checked="schemaComment" type="checkbox" @change="schemaComment = checked($event)">{{ t('Строка схемы для редактора', 'Editor schema line') }}</label>
      </div>
      <div class="bsize" :class="{ 'is-over': bytes > manifestLimit }">
        <span class="bsize-bar"><i :style="{ transform: `scaleX(${share})` }" /></span>
        <span>{{ sizeText }} {{ t('из 512 KiB', 'of 512 KiB') }}</span>
      </div>
      <CodeBlock :code="text" lang="yaml" label="reclash.yaml" />
      <div class="bactions">
        <button type="button" class="btn btn-primary btn-s" :disabled="empty" @click="download">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m-5-5 5 5 5-5M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          {{ t('Скачать', 'Download') }}
        </button>
        <p v-if="routing" class="bf-help">{{ t('Импортированный routing записан в конец без изменений.', 'Imported routing is written at the end, unchanged.') }}</p>
      </div>
    </section>

    <section class="bpanel" aria-labelledby="bout-serve">
      <h3 id="bout-serve" class="bpanel-h">{{ t('Где разместить', 'Where to host it') }}</h3>
      <ul class="bfacts">
        <li>{{ t('Любой статический хостинг по https, постоянный адрес. Редирект должен заканчиваться на https.', 'Any static host over https at a stable URL. A redirect must end on https.') }}</li>
        <li>{{ t('Файл скачивается вместе с обновлением подписки, за 8 секунд. ETag и 304 Not Modified учитываются.', 'The file is fetched with the subscription update, within 8 seconds. ETag and 304 Not Modified are honored.') }}</li>
        <li>{{ t('С другого адреса приходят только User-Agent, Accept и Accept-Language; ID устройства не уходит.', 'Another origin gets only User-Agent, Accept and Accept-Language; the device ID never leaves the subscription origin.') }}</li>
      </ul>
      <div class="bf">
        <div class="bf-head"><label for="bout-url">{{ t('Адрес файла', 'File URL') }}</label></div>
        <input id="bout-url" :value="url" class="input mono" type="url" inputmode="url" :placeholder="exampleManifestUrl" spellcheck="false" autocomplete="off" :aria-invalid="urlProblem ? true : undefined" @input="emit('update:url', ($event.target as HTMLInputElement).value)">
        <p class="bf-help">{{ t('Сайт не обращается по этой ссылке; она только подставляется в примеры.', 'The site never opens this link; it only fills the examples.') }}</p>
        <p v-if="urlProblem" class="bf-err" role="alert">{{ urlProblem }}</p>
      </div>
    </section>

    <section class="bpanel" aria-labelledby="bout-header">
      <h3 id="bout-header" class="bpanel-h">{{ t('Заголовок reclash-config', 'The reclash-config header') }}</h3>
      <p class="bf-help">{{ t('Один раз, в ответе подписки по https. Без заголовка сохранённый манифест удаляется.', 'Once, in an https subscription response. Leaving it out deletes the stored manifest.') }}</p>
      <div class="bseg is-tabs" role="tablist" :aria-label="t('Сервер', 'Server')">
        <button v-for="item in tabs" :key="item.key" type="button" role="tab" :aria-selected="tab === item.key" @click="tab = item.key">{{ item.text }}</button>
      </div>
      <CodeBlock :key="tab" class="is-swap" :code="snippet.code" :lang="snippet.lang" :label="snippet.label" />
      <p v-if="tab === 'remnawave'" class="bf-help">{{ t('Выше правила Fallback Base64: правила идут сверху вниз до первого совпадения. Проверено на Remnawave 3.4.7.', 'Above the Fallback Base64 rule: rules run top to bottom and stop at the first match. Checked on Remnawave 3.4.7.') }}</p>
      <p v-else-if="tab !== 'header'" class="bf-help">{{ t('Прокси и CDN должны пропускать заголовок без изменений.', 'Proxies and CDNs must pass the header through unchanged.') }}</p>
      <SiteLink class="tlink" :to="docPath(language, 'providers/rollout')">{{ t('Доставка и отладка', 'Delivery and debugging') }}</SiteLink>
    </section>

    <section v-if="listed || required" class="bpanel" aria-labelledby="bout-body">
      <h3 id="bout-body" class="bpanel-h">{{ t('Что нужно в теле подписки', 'What the subscription body needs') }}</h3>
      <template v-if="listed">
        <p class="bf-help">{{ t('policy.global: listed — в режиме Global трафик уходит только через узлы, достижимые из группы GLOBAL.', 'policy.global: listed — in Global mode traffic leaves only through nodes reachable from the GLOBAL group.') }}</p>
        <div class="bpanel-row">
          <label class="bnum"><span>filter</span><input v-model="filter" class="mono" spellcheck="false" :aria-label="t('Фильтр узлов', 'Node filter')"></label>
          <label class="bcheck"><input :checked="remnawave" type="checkbox" @change="remnawave = checked($event)">{{ t('Панель Remnawave', 'Remnawave panel') }}</label>
        </div>
        <CodeBlock :code="globalGroup(filter, remnawave)" lang="yaml" :label="t('Тело подписки', 'Subscription body')" />
        <p class="note warn">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 18 16.6H2Zm0 5.4v3.6m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" /></svg>
          <span>{{ t('Remnawave добавляет все хосты в каждую группу без remnawave: { include-proxies: false }, даже с filter. Тогда разрешено всё, а инспектор пишет:', 'Remnawave appends every host to each group that lacks remnawave: { include-proxies: false }, even a group with filter. Then everything is allowed and the inspector warns:') }} <code>policy.global is listed, but GLOBAL reaches every inline node of the body, so the lock restricts nothing</code></span>
        </p>
        <p class="note warn">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 18 16.6H2Zm0 5.4v3.6m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" /></svg>
          <span>{{ t('Узлы, перечисленные в proxies вручную, которых у пользователя нет, ломают конфиг при применении:', 'Hand-listed proxies that name a host the user lacks fail when the config is applied:') }} <code>GLOBAL: 'Poland LTE' not found</code>{{ t('. С global: listed профиль блокируется.', '. With global: listed the profile is blocked.') }}</span>
        </p>
      </template>
      <template v-if="required">
        <p class="bf-help">{{ t('policy.apps: required — список берётся только из tun.exclude-package тела; apps.exclude в нём не участвует.', 'policy.apps: required — the list comes only from the body\'s tun.exclude-package; apps.exclude is not part of it.') }}</p>
        <CodeBlock :code="tunExclusions(packages.length ? packages : ['com.example.bank'])" lang="yaml" :label="t('Тело подписки', 'Subscription body')" />
        <p class="bf-help">{{ packages.length ? t('Собрано из apps.exclude этого файла.', 'Built from this file\'s apps.exclude.') : t('Пример: добавьте пакеты в apps.exclude, чтобы подставить свои.', 'An example: add packages to apps.exclude to fill in your own.') }}</p>
      </template>
      <SiteLink class="tlink" :to="docPath(language, 'providers/policy')">{{ t('Политика безопасности', 'Safety policy') }}</SiteLink>
    </section>
  </div>
</template>
