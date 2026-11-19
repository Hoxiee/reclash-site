<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import { docPath } from '~~/shared/docs/catalogue'
const { language, t } = useText()
</script>

<template>
<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-about">
        <SiteLink class="logo" :to="pagePath(language, 'index')"><BrandMark class="logo-mark" />ReClash</SiteLink>
        <p>{{ t("Открытый клиент для mihomo с маршрутизацией RCX. Не продаёт доступ и не выдаёт подписки.", "An open-source mihomo client with RCX routing. It does not sell access or provide subscriptions.", "ReClash 是支持 RCX 路由的开源 mihomo 客户端，不出售访问权限，也不提供订阅。") }}</p>
        <div class="foot-social">
          <SiteLink class="btn btn-ghost btn-s" to="https://github.com/Hoxiee/ReClash">GitHub</SiteLink>
          <SiteLink class="btn btn-ghost btn-s" to="https://t.me/ReClashApp">Telegram</SiteLink>
        </div>
      </div>
      <div><h4>{{ t("Сайт", "Site", "站点") }}</h4><ul>
        <li><SiteLink :to="pagePath(language, 'index')">{{ t("Клиент", "Client", "客户端") }}</SiteLink></li><li><SiteLink :to="pagePath(language, 'download')">{{ t("Загрузки", "Downloads", "下载") }}</SiteLink></li>
        <li><SiteLink :to="pagePath(language, 'start')">{{ t("Быстрый старт и FAQ", "Quick start and FAQ", "快速入门与常见问题") }}</SiteLink></li><li><SiteLink :to="pagePath(language, 'docs')">{{ t("Документация", "Documentation", "文档") }}</SiteLink></li>
        <li><SiteLink :to="docPath(language, 'rcx')">{{ t("Автомаршрутизация RCX", "RCX auto routing", "RCX 自动路由") }}</SiteLink></li>
        <li><SiteLink :to="pagePath(language, 'reference')">{{ t("Справочник по заголовкам", "Header reference", "标头参考") }}</SiteLink></li><li><SiteLink :to="pagePath(language, 'builder')">{{ t("Конструктор манифеста", "Manifest builder", "清单构建器") }}</SiteLink></li>
      </ul></div>
      <div><h4>{{ t("Исходники", "Source", "源码") }}</h4><ul>
        <li><SiteLink to="https://github.com/Hoxiee/ReClash">GitHub</SiteLink></li><li><SiteLink to="https://github.com/Hoxiee/ReClash/releases">{{ t("Релизы", "Releases", "发行版") }}</SiteLink></li>
        <li><SiteLink to="https://github.com/Hoxiee/ReClash/issues">{{ t("Баг-трекер", "Issue tracker", "问题跟踪") }}</SiteLink></li><li><SiteLink to="https://github.com/Hoxiee/ReClash/blob/dev/LICENSE">GPL-3.0</SiteLink></li>
      </ul></div>
      <div><h4>{{ t("Стоит на плечах", "Built on", "基于") }}</h4><ul>
        <li><SiteLink to="https://github.com/chen08209/FlClash">FlClash</SiteLink></li><li><SiteLink to="https://github.com/MetaCubeX/mihomo">mihomo</SiteLink></li>
      </ul></div>
    </div>
    <div class="wordmark" aria-hidden="true"><BrandMark class="wordmark-mark" mono /><span class="wordmark-text">ReClash</span></div>
    <div class="foot-legal">
      <span>© <span data-year>2026</span> ReClash</span><span>{{ t("Лицензия GPL-3.0", "GPL-3.0 license", "GPL-3.0 许可证") }}</span><span>{{ t("Форк FlClash. Не аффилирован с FlClash, mihomo или FlClashX.", "A FlClash fork. Not affiliated with FlClash, mihomo or FlClashX.", "FlClash 的分支，与 FlClash、mihomo 或 FlClashX 无隶属关系。") }}</span>
      <span class="live"><span class="dot-live" aria-hidden="true"></span>{{ t("Проект живой", "Actively maintained", "持续维护中") }}</span>
    </div>
  </div>
</footer>
</template>
