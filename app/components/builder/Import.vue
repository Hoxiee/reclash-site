<script setup lang="ts">
import { importManifest, ManifestVersionError, manifestLimit, type Imported } from '~~/shared/provider/builder/document'
import { YamlError } from '~~/shared/provider/builder/yaml'
// Reads a manifest the provider already has. The text stays in the browser; links inside it are never opened.
const emit = defineEmits<{ imported: [result: Imported] }>()
const { t } = useText()
const text = ref('')
const over = ref(false)
const problem = ref('')
const reading = ref(false)
let readRevision = 0
onBeforeUnmount(() => { readRevision++ })

function read(source: string) {
  readRevision++
  reading.value = false
  problem.value = ''
  if (!source.trim()) return
  if (new TextEncoder().encode(source).length > manifestLimit) {
    problem.value = t('Файл больше 512 KiB — приложение его не примет.', 'The file is over 512 KiB; the app would not accept it.')
    return
  }
  try {
    const result = importManifest(source)
    emit('imported', result)
    text.value = ''
  } catch (error) {
    const line = error instanceof YamlError && error.line ? t(`Строка ${error.line}: `, `Line ${error.line}: `) : ''
    problem.value = error instanceof ManifestVersionError ? t(`Эта версия файла не поддерживается. Конструктор работает с version: ${error.expected}; текущая форма не изменена.`, `This file version is not supported. The builder uses version: ${error.expected}; your current form is unchanged.`) : line + (error instanceof Error ? error.message : String(error))
  }
}
async function readFile(file: File | undefined) {
  if (!file) return
  const revision = ++readRevision
  problem.value = ''
  if (file.size > manifestLimit) {
    reading.value = false
    problem.value = t('Файл больше 512 KiB — приложение его не примет.', 'The file is over 512 KiB; the app would not accept it.')
    return
  }
  reading.value = true
  try {
    const source = await file.text()
    if (revision === readRevision) read(source)
  } catch {
    if (revision === readRevision) problem.value = t('Не удалось прочитать файл. Вставьте его текст; текущая форма не изменена.', 'Could not read the file. Paste its text; your current form is unchanged.')
  } finally {
    if (revision === readRevision) reading.value = false
  }
}
function drop(event: DragEvent) {
  over.value = false
  readFile(event.dataTransfer?.files[0])
}
</script>

<template>
  <div class="bimport">
    <label class="drop bdrop" :class="{ 'is-over': over }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="drop">
      <input type="file" accept=".yaml,.yml,text/yaml,application/yaml,text/plain" :aria-label="t('Выбрать reclash.yaml', 'Choose reclash.yaml')" @change="readFile(($event.target as HTMLInputElement).files?.[0]); ($event.target as HTMLInputElement).value = ''">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m-4.5 4.5L12 4l4.5 4.5M5 14v5h14v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <b>{{ t('Перетащите reclash.yaml', 'Drop reclash.yaml here') }}</b>
      <small>{{ t('или нажмите, чтобы выбрать файл', 'or click to choose a file') }}</small>
    </label>
    <div class="bf">
      <div class="bf-head"><label for="bimport-text">{{ t('Или вставьте текст', 'Or paste the text') }}</label></div>
      <textarea id="bimport-text" v-model="text" class="input mono" rows="4" spellcheck="false" autocomplete="off" placeholder="version: 1&#10;provider:&#10;  name: Example VPN" />
    </div>
    <div class="bactions">
      <button type="button" class="btn btn-ghost btn-s" :disabled="!text.trim() || reading" @click="read(text)">{{ t('Загрузить в форму', 'Load into the form') }}</button>
      <small class="bf-help">{{ t('Текущая форма заменяется. Ссылки из файла не открываются.', 'This replaces the current form. Links in the file are not opened.') }}</small>
    </div>
    <p v-if="problem" class="bf-err" role="alert">{{ problem }}</p>
    <p v-if="reading" class="bf-help" role="status">{{ t('Читаем файл…', 'Reading the file…') }}</p>
  </div>
</template>
