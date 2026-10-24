<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
const { language, t } = useText()
</script>

<template>
<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-about">
        <SiteLink class="logo" :to="pagePath(language, 'index')"><BrandMark class="logo-mark" />ReClash</SiteLink>
        <p>{{ t("Клиент для mihomo с обходом DPI. Не продаёт доступ, не выдаёт подписки и не заменяет вашу осторожность.", "A mihomo client with DPI bypass. It does not sell access, provide subscriptions or replace your judgment.") }}</p>
        <div class="foot-social">
          <SiteLink class="btn btn-ghost btn-s" to="https://github.com/Hoxiee/ReClash">GitHub</SiteLink>
          <SiteLink class="btn btn-ghost btn-s" to="https://t.me/ReClashApp">Telegram</SiteLink>
        </div>
      </div>
      <div><h4>{{ t("Сайт", "Site") }}</h4><ul>
        <li><SiteLink :to="pagePath(language, 'index')">{{ t("Клиент", "Client") }}</SiteLink></li><li><SiteLink :to="pagePath(language, 'download')">{{ t("Загрузки", "Downloads") }}</SiteLink></li>
        <li><SiteLink :to="pagePath(language, 'start')">{{ t("Быстрый старт и FAQ", "Quick start and FAQ") }}</SiteLink></li><li><SiteLink :to="pagePath(language, 'docs')">{{ t("Документация по заголовкам", "Header documentation") }}</SiteLink></li>
        <li><SiteLink :to="pagePath(language, 'reference')">{{ t("Справочник по заголовкам", "Header reference") }}</SiteLink></li><li><SiteLink :to="pagePath(language, 'builder')">{{ t("Конструктор заголовков", "Header builder") }}</SiteLink></li>
      </ul></div>
      <div><h4>{{ t("Исходники", "Source") }}</h4><ul>
        <li><SiteLink to="https://github.com/Hoxiee/ReClash">GitHub</SiteLink></li><li><SiteLink to="https://github.com/Hoxiee/ReClash/releases">{{ t("Релизы", "Releases") }}</SiteLink></li>
        <li><SiteLink to="https://github.com/Hoxiee/ReClash/issues">{{ t("Баг-трекер", "Issue tracker") }}</SiteLink></li><li><SiteLink to="https://github.com/Hoxiee/ReClash/blob/main/LICENSE">GPL-3.0</SiteLink></li>
      </ul></div>
      <div><h4>{{ t("Стоит на плечах", "Built on") }}</h4><ul>
        <li><SiteLink to="https://github.com/chen08209/FlClash">FlClash</SiteLink></li><li><SiteLink to="https://github.com/MetaCubeX/mihomo">mihomo</SiteLink></li>
        <li><SiteLink to="https://github.com/hufrea/byedpi">ByeDPI</SiteLink></li>
      </ul></div>
    </div>
    <div class="wordmark" aria-hidden="true"><BrandMark class="wordmark-mark" mono /><span class="wordmark-text">ReClash</span></div>
    <div class="foot-legal">
      <span>© <span data-year>2026</span> ReClash</span><span>{{ t("Лицензия GPL-3.0", "GPL-3.0 license") }}</span><span>{{ t("Форк FlClash. Не аффилирован с FlClash, mihomo или FlClashX.", "A FlClash fork. Not affiliated with FlClash, mihomo or FlClashX.") }}</span>
      <span class="live"><span class="dot-live" aria-hidden="true"></span>{{ t("Проект живой", "Actively maintained") }}</span>
    </div>
  </div>
</footer>
</template>
