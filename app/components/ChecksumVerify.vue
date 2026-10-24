<script setup lang="ts">
const { t } = useText()
const expected = ref(''), title = ref(''), detail = ref(''), status = ref('info'), over = ref(false)
const verdict = ref(0)
let file: File | undefined, hash: string | undefined, request = 0
function say(state: string, message: string, value = '') { status.value = state; title.value = message; detail.value = value; verdict.value++ }
function judge() {
  if (!hash || !file) return
  const text = expected.value.trim()
  if (!text) return say('info', t('Хеш посчитан. Вставьте ожидаемый из релиза, чтобы сравнить.', 'Hash calculated. Paste the expected release hash to compare.'), hash)
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  let match: string | undefined
  for (const line of lines) {
    const pair = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i)
    if (pair && pair[2]!.split(/[\\/]/).pop() === file.name) { match = pair[1]!.toLowerCase(); break }
  }
  if (!match) {
    const all = text.match(/\b[a-f0-9]{64}\b/gi) || []
    if (all.length === 1) match = all[0]!.toLowerCase()
    else if (all.length) return say('bad', t(`В SHA256SUMS нет строки для «${file.name}». Проверьте, тот ли это файл.`, `SHA256SUMS has no line for “${file.name}”. Check that you chose the right file.`), hash)
    else return say('bad', t('Не вижу в поле SHA256-хеша: нужно 64 шестнадцатеричных символа.', 'No SHA256 hash found: use 64 hexadecimal characters.'))
  }
  if (match === hash) say('ok', t('Совпадает — это тот самый файл.', 'Match: this is the expected file.'), hash)
  else say('bad', t('Не совпадает. Не запускайте файл и напишите в issues.', 'Mismatch. Do not run the file; report it in issues.'), t(`ваш:      ${hash}\nожидался: ${match}`, `actual:   ${hash}\nexpected: ${match}`))
}
async function take(next?: File) {
  if (!next) return
  const id = ++request; file = next; hash = undefined
  say('info', t(`Считаем хеш «${next.name}»…`, `Calculating the hash of “${next.name}”…`))
  try {
    const bytes = await next.arrayBuffer(), result = await crypto.subtle.digest('SHA-256', bytes)
    if (id !== request) return
    hash = [...new Uint8Array(result)].map(byte => byte.toString(16).padStart(2, '0')).join(''); judge()
  } catch { if (id === request) say('bad', t('Не удалось прочитать файл. Попробуйте ещё раз или проверьте в терминале.', 'Could not read the file. Try again or verify it in a terminal.')) }
}
function choose(event: Event) { take((event.target as HTMLInputElement).files?.[0]) }
function drop(event: DragEvent) { over.value = false; take(event.dataTransfer?.files[0]) }
onBeforeUnmount(() => request++)
</script>

<template>
  <div id="verify" class="verify">
    <label class="drop" :class="{ 'is-over': over }" @dragenter.prevent="over = true" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="drop">
      <input type="file" :aria-label="t('Выберите скачанный файл', 'Choose the downloaded file')" @change="choose">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <b>{{ t('Перетащите файл сюда или выберите', 'Drop a file here or choose one') }}</b><small>{{ t('Файл никуда не загружается — хеш считается прямо в браузере.', 'The file is never uploaded. Its hash is calculated in your browser.') }}</small>
    </label>
    <div class="field"><label for="sums">{{ t('Ожидаемый хеш или содержимое SHA256SUMS', 'Expected hash or SHA256SUMS contents') }}</label><textarea id="sums" v-model="expected" class="input" spellcheck="false" :placeholder="t('Вставьте строку из SHA256SUMS или весь файл', 'Paste a line from SHA256SUMS or the entire file')" @input="judge" /></div>
    <div :key="verdict" class="verdict pop" :class="status === 'info' ? '' : status" :hidden="!title" aria-live="polite"><span class="vi"><svg viewBox="0 0 24 24"><path :d="status === 'ok' ? 'M5 12.5l4.5 4.5L19 7.5' : status === 'bad' ? 'M7 7l10 10M17 7 7 17' : 'M12 7v6m0 4v.1'" /></svg></span><div><b>{{ title }}</b><code v-if="detail">{{ detail }}</code></div></div>
    <div class="term"><div class="th"><h3>{{ t('Linux и macOS', 'Linux and macOS') }}</h3><button class="btn btn-ghost btn-s" type="button" data-copy="#t-unix" :data-label="t('Копировать', 'Copy')"><span class="btn-label">{{ t('Копировать', 'Copy') }}</span></button></div><pre id="t-unix"><CodeLines code="sha256sum -c SHA256SUMS --ignore-missing" lang="shell" /></pre></div>
    <div class="term"><div class="th"><h3>Windows (PowerShell)</h3><button class="btn btn-ghost btn-s" type="button" data-copy="#t-win" :data-label="t('Копировать', 'Copy')"><span class="btn-label">{{ t('Копировать', 'Copy') }}</span></button></div><pre id="t-win"><CodeLines code="Get-FileHash .\ReClash-<version>-windows-amd64-setup.exe -Algorithm SHA256" lang="powershell" /></pre></div>
  </div>
</template>
