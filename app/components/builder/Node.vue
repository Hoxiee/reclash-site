<script setup lang="ts">
import { entryFor, formEntries, schemaPathOf } from '~~/shared/provider/builder/form'
import { actionKeys, kindOf, nodeAt } from '~~/shared/provider/builder/schema'
import { splitPath } from '~~/shared/provider/builder/document'
import { issueText } from '~~/shared/provider/builder/validate'
// A group of the manifest (a section, `provider.renew`, a card's `button`) or a single field.
const props = defineProps<{ path: string, skip?: string[], flat?: boolean }>()
const { language, t } = useToolText()
const { manifest, get, set, issuesAt } = useBuilder()
const entry = computed(() => entryFor(props.path))
const node = computed(() => nodeAt(splitPath(props.path), manifest))
const kind = computed(() => kindOf(node.value))
const value = computed(() => get(props.path))
const actions = computed(() => kind.value === 'group' ? actionKeys(node.value, value.value) : undefined)
const children = computed(() => {
  const parent = schemaPathOf(props.path)
  return formEntries
    .filter(item => item.path.startsWith(`${parent}.`) && !item.path.slice(parent.length + 1).includes('.'))
    .map(item => item.path.slice(parent.length + 1))
    .filter(key => !props.skip?.includes(key) && !actions.value?.keys.includes(key) && nodeAt([...splitPath(props.path), key], manifest))
    .map(key => `${props.path}.${key}`)
})
const chosen = ref<string>()
const action = computed(() => actions.value?.keys.find(key => value.value && typeof value.value === 'object' && key in value.value) ?? chosen.value)
function pickAction(event: Event) {
  const next = (event.target as HTMLSelectElement).value || undefined
  for (const key of actions.value?.keys ?? []) if (key !== next) set(`${props.path}.${key}`, undefined)
  chosen.value = next
}
const groupIssues = computed(() => issuesAt(props.path).map(issue => issueText(issue, language.value)))
const id = computed(() => fieldId(props.path))
</script>

<template>
  <BuilderField v-if="kind !== 'group'" :path="path" />
  <component :is="flat ? 'div' : 'fieldset'" v-else class="bgroup" :class="{ 'is-flat': flat }" :data-path="path">
    <legend v-if="!flat && entry" class="bgroup-head"><span>{{ entry.label[language] }}</span><code class="bf-key">{{ path.split('.').at(-1) }}</code></legend>
    <p v-if="!flat && entry?.help" class="bf-help bgroup-help">{{ entry.help[language] }}</p>
    <div class="bgrid">
      <BuilderNode v-for="child in children" :key="child" :path="child" />
      <div v-if="actions" class="bf bf-action is-wide" :data-path="action ? `${path}.${action}` : path">
        <div class="bf-head"><label :for="`${id}-action`">{{ t('Действие', 'Action') }}</label><code class="bf-key">{{ actions.keys.join(' | ') }}</code></div>
        <select :id="`${id}-action`" class="input bf-select" :value="action ?? ''" @change="pickAction">
          <option v-if="!actions.required" value="">{{ t('Без действия', 'No action') }}</option>
          <option v-else value="" disabled>{{ t('Выберите действие', 'Choose an action') }}</option>
          <option v-for="key in actions.keys" :key="key" :value="key">{{ entryFor(`${path}.${key}`)?.label[language] ?? key }} · {{ key }}</option>
        </select>
        <BuilderField v-if="action" :key="action" :path="`${path}.${action}`" compact />
      </div>
    </div>
    <p v-for="(issue, index) in groupIssues" :key="index" class="bf-err" role="alert">{{ issue }}</p>
  </component>
</template>
