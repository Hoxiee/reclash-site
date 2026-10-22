<script setup lang="ts">
import type { BuilderField } from '~~/shared/provider/builder'
import { normHex } from '~~/shared/provider/theme'
defineProps<{ field: BuilderField, value: string | number, error?: string | null }>()
const emit = defineEmits<{ update: [event: Event, color?: boolean] }>()
const { language, t } = useText()
</script>

<template>
  <div class="field" :data-key="field.key">
    <label :for="`f-${field.key}`">{{ field.label[language] }}</label>
    <textarea v-if="field.type === 'textarea'" :id="`f-${field.key}`" class="input" :maxlength="field.max" rows="2" :value="value" :aria-invalid="error ? true : undefined" @input="emit('update', $event)" />
    <div v-else-if="field.type === 'color'" class="b-color">
      <input type="color" :aria-label="t('Выбрать цвет', 'Choose a color')" :value="`#${(normHex(value) || '7C5CFF').toLowerCase()}`" @input="emit('update', $event, true)">
      <input :id="`f-${field.key}`" class="input" :value="value" spellcheck="false" autocomplete="off" :aria-invalid="error ? true : undefined" @input="emit('update', $event)">
    </div>
    <input v-else :id="`f-${field.key}`" class="input" :type="field.type" :value="value" :maxlength="field.max" :min="field.min" :placeholder="field.placeholder || ''" autocomplete="off" spellcheck="false" :aria-invalid="error ? true : undefined" @input="emit('update', $event)">
    <span v-if="field.hint" class="hint">{{ field.hint[language] }}</span><span class="err" role="alert">{{ error || '' }}</span>
  </div>
</template>
