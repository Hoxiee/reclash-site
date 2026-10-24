<script setup lang="ts">
// Import-link builder shared by the home and start pages. Typing, building and copying are wired in app/motion/site.js.
defineProps<{ title: string, text?: string }>()
const { t } = useText()
</script>

<template>
  <div class="importer" id="importer">
    <div class="imp-head">
      <h3>{{ title }}</h3>
      <span class="imp-local">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7M3.5 7h9v6.5h-9Z" /></svg>
        {{ t("Только в браузере", "Browser only") }}
      </span>
    </div>
    <p v-if="text" class="muted imp-text">{{ text }}</p>
    <div class="field">
      <label for="sub-url">{{ t("Ваша ссылка на подписку", "Your subscription link") }}</label>
      <div class="imp-row">
        <div class="imp-input">
          <input class="input" id="sub-url" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://…" aria-describedby="sub-err">
          <span class="imp-ghost" aria-hidden="true"></span>
        </div>
        <button class="btn btn-primary copy-btn" type="button">
          <svg class="ico-m cp" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v10H9zM5 15V5h10" /></svg>
          <svg class="ico-m ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <span class="btn-label">{{ t("Скопировать", "Copy") }}</span>
        </button>
      </div>
      <span class="err" id="sub-err" role="alert"></span>
    </div>
    <div class="out">
      <div class="out-top">
        <span class="lbl">{{ t("Пример ссылки-импорта", "Example import link") }}</span>
        <span class="out-state" aria-hidden="true"><i></i><span>{{ t("пример", "sample") }}</span></span>
      </div>
      <code><span class="seg-s">reclash://</span><span class="seg-a">install-config</span><span class="seg-q">?url=</span><span class="hl">https%3A%2F%2Fsub.example%2Flink%2Fabc123</span></code>
      <ol class="out-parts" aria-hidden="true">
        <li class="p-s">{{ t("схема", "scheme") }}</li>
        <li class="p-a">{{ t("действие", "action") }}</li>
        <li class="p-u">{{ t("ваша ссылка, закодированная", "your link, encoded") }}</li>
      </ol>
    </div>
    <span class="sr-only" role="status" data-imp-status></span>
  </div>
</template>
