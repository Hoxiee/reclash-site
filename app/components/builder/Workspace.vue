<script setup lang="ts">
import { formSections, entryFor } from '~~/shared/provider/builder/form'
import { searchFields, starters } from '~~/shared/provider/builder/workbench'
import { issueText } from '~~/shared/provider/builder/validate'

const props = defineProps<{ saved: 'idle' | 'saving' | 'saved' | 'failed' }>()
const emit = defineEmits<{ starter: [key: string], select: [path: string], expand: [open: boolean] }>()
const { language, t } = useText()
const { manifest, issues } = useBuilder()
const query = ref('')
const templatesOpen = ref(false)
const templateTrigger = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const matches = ref<HTMLElement>()
const results = computed(() => searchFields(query.value, manifest, language.value))
const problems = computed(() => [...issues.value.values()].flat())
const issueLimit = ref(6)
const filled = computed(() => formSections.filter(section => section.key !== 'version' && manifest[section.key] !== undefined).length)
function choose(path: string) { query.value = ''; emit('select', path) }
function chooseStarter(key: string) {
  emit('starter', key)
  templatesOpen.value = false
  nextTick(() => templateTrigger.value?.focus())
}
function focusResult(index: number) {
  const buttons = matches.value?.querySelectorAll<HTMLButtonElement>('button')
  if (buttons?.length) buttons[(index + buttons.length) % buttons.length]?.focus()
}
function resultKey(event: KeyboardEvent, index: number) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); focusResult(index + (event.key === 'ArrowDown' ? 1 : -1)) }
  else if (event.key === 'Escape') { event.preventDefault(); query.value = ''; input.value?.focus() }
}
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <section class="bworkspace" :aria-label="t('Рабочая область', 'Workspace')">
    <div class="bworkspace-head">
      <h2>{{ t('Ваш манифест', 'Your manifest') }}</h2>
      <span class="bdraft-state" :data-state="props.saved" role="status">
        {{ props.saved === 'saving' ? t('Сохраняем в ссылке…', 'Saving to the link…') : props.saved === 'saved' ? t('Сохранено в ссылке', 'Saved to the link') : props.saved === 'failed' ? t('Черновик только в форме', 'Draft is only in the form') : t('Новый черновик', 'New draft') }}
      </span>
    </div>
    <div class="bfind">
      <label for="bfind-input">{{ t('Найти поле', 'Find a field') }}</label>
      <div class="bfind-control">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input id="bfind-input" ref="input" v-model="query" class="input" type="search" maxlength="128" autocomplete="off" spellcheck="false" :placeholder="t('Название или ключ: логотип, color, renewal…', 'Name or key: logo, color, renewal…')" aria-describedby="bfind-help" @keydown.esc.stop="query = ''" @keydown.down.prevent="focusResult(0)" @keydown.enter.prevent="results[0] && choose(results[0].target)">
        <button v-if="query" type="button" class="bicon" :aria-label="t('Очистить поиск', 'Clear the search')" @click="query = ''; input?.focus()"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7" /></svg></button>
        <kbd v-else aria-hidden="true">/</kbd>
      </div>
      <p id="bfind-help" class="bf-help">{{ t('Поиск по двум языкам; Enter открывает первое найденное поле.', 'Searches both languages; Enter opens the first matching field.') }}</p>
      <ul v-if="query.trim() && results.length" ref="matches" class="bfind-results">
        <li v-for="(result, index) in results" :key="`${result.path}:${result.target}`">
          <button type="button" @click="choose(result.target)" @keydown="resultKey($event, index)">
            <span><b>{{ result.label }}</b><small>{{ result.section }}{{ result.target !== result.path ? t(' · добавьте элемент в разделе', ' · add an entry in this section') : '' }}</small></span>
            <code>{{ result.path }}</code>
            <span v-if="result.configured" class="bfind-set" :aria-label="t('Поле заполнено', 'Field has a value')" />
          </button>
        </li>
      </ul>
      <p v-else-if="query.trim()" class="bf-help" role="status">{{ t('Ничего не найдено. Попробуйте ключ YAML или другое название.', 'No matches. Try a YAML key or another label.') }}</p>
      <p v-if="results.length === 12" class="bf-help">{{ t('Показаны первые 12 результатов. Уточните запрос, чтобы найти остальные.', 'Showing the first 12 results. Narrow the query to find others.') }}</p>
    </div>
    <details class="bstarter-pick" :open="templatesOpen" @toggle="templatesOpen = ($event.target as HTMLDetailsElement).open">
      <summary ref="templateTrigger"><span>{{ t('Добавить заготовку', 'Add a template') }}</span><svg class="bchev" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5" /></svg></summary>
      <div class="bstarter-body">
        <div class="bstarters" role="group" :aria-label="t('Заготовки манифеста', 'Manifest templates')">
          <button v-for="starter in starters" :key="starter.key" type="button" class="bchip" :title="starter.summary[language]" @click="chooseStarter(starter.key)"><span aria-hidden="true">+</span>{{ starter.title[language] }}</button>
        </div>
        <p class="bf-help">{{ t('Заготовки добавляют только отсутствующие поля: ваши значения и списки не меняются. Все адреса — примеры. Правку можно отменить.', 'Templates add only missing fields: your values and lists stay unchanged. Every address is an example. The change can be undone.') }}</p>
      </div>
    </details>
    <div class="bsection-actions">
      <span class="bf-help">{{ t(`Заполнено разделов: ${filled}`, `${filled} sections have values`) }}</span>
      <button type="button" class="blink" @click="emit('expand', true)">{{ t('Развернуть всё', 'Expand all') }}</button>
      <button type="button" class="blink" @click="emit('expand', false)">{{ t('Свернуть всё', 'Collapse all') }}</button>
    </div>
    <div v-if="problems.length" class="bproblems">
      <h3>{{ t(`Проверьте поля (${problems.length})`, `Check these fields (${problems.length})`) }}</h3>
      <p class="bf-help">{{ t('Нажмите ошибку, чтобы перейти к полю. Окончательный результат применения покажет парсер приложения.', 'Choose a problem to go to its field. The app parser shows what will actually be applied.') }}</p>
      <ul>
        <li v-for="issue in problems.slice(0, issueLimit)" :key="`${issue.path}:${issue.code}`">
          <button type="button" @click="choose(issue.path)"><code>{{ issue.path || 'version' }}</code><span>{{ entryFor(issue.path)?.label[language] }}{{ entryFor(issue.path) ? ': ' : '' }}{{ issueText(issue, language) }}</span></button>
        </li>
      </ul>
      <button v-if="problems.length > issueLimit" type="button" class="blink" @click="issueLimit += 20">{{ t(`Ещё ошибок: ${problems.length - issueLimit}`, `${problems.length - issueLimit} more problems`) }}</button>
    </div>
  </section>
</template>
