<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import '~/assets/css/download.css'
usePageMeta('download')
const { language, t } = useText()
// One GitHub request feeds both the file picker and the changelog.
const releases = useReleases()
const buildScript = computed(() => [
  'git clone https://github.com/Hoxiee/ReClash.git',
  'cd ReClash',
  'flutter pub get',
  `dart run setup.dart            ${t('# хост-платформа', '# host platform')}`,
  'dart run setup.dart android    # APK',
  '# → dist/',
].join('\n'))
</script>

<template>
<div>
<section class="ph"><div class="wrap ph-grid">
  <div>
    <h1 data-words>{{ t("Скачайте или соберите сами.", "Download or build it yourself.") }}</h1>
    <p class="lede" data-fade>{{ t("Список файлов последнего релиза приходит прямо из GitHub. Ниже — что под какой системой, проверка SHA256 и сборка из исходников.", "The latest release files come directly from GitHub. Below: packages for each system, SHA256 verification and building from source.") }}</p>
    <div class="ph-tags" data-fade style="--d:120ms"><span class="tag">GPL-3.0</span><span class="tag">{{ t("Четыре платформы", "Four platforms") }}</span><span class="tag">{{ t("SHA256 в каждом релизе", "SHA256 in every release") }}</span></div>
  </div>
  <svg class="ph-ring" viewBox="0 0 400 400" aria-hidden="true">
  <defs><linearGradient id="phG" x1="60" y1="60" x2="340" y2="340" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--brand-2)"/><stop offset=".5" style="stop-color:var(--brand)"/><stop offset="1" style="stop-color:var(--brand-3)"/></linearGradient></defs>
  <circle class="glow" cx="200" cy="200" r="120"/>
  <path class="rg" stroke-width="30"/>
  <path class="glyph" d="M200 158v80m0 0-30-30m30 30 30-30M165 252h70"/>
</svg>
</div></section>

<section class="sub-sec" id="latest" style="padding-top:0;border-top:0"><div class="wrap">
  <ReleaseList :feed="releases" />
</div></section>

<section class="sub-sec" id="changelog"><div class="wrap two">
  <div class="sec-head">
    <h2 data-words>{{ t("Что нового.", "What's new.") }}</h2>
    <p class="lede" data-fade>{{ t("Заметки к релизам приходят из GitHub вместе со списком файлов: сначала текущий, ниже — предыдущие.", "Release notes come from GitHub with the file list: the current release first, earlier ones below.") }}</p>
  </div>
  <ReleaseNotes :feed="releases" />
</div></section>

<section class="sub-sec" id="platforms"><div class="wrap two">
  <div class="sec-head"><h2 data-words>{{ t("Что под какой системой.", "Packages for each system.") }}</h2></div>
  <div>
    <ul class="pcards" data-group data-items=".pcard" data-cpull="0.03">
      <li class="pcard" data-mg><h3>Windows</h3><span class="fmt">{{ t("Установщик или портативный ZIP", "Installer or portable ZIP") }}</span><div class="arch"><span>x64</span><span>ARM64</span></div>
        <p>{{ t("Windows 10 и новее. Портативная сборка не требует прав администратора, а режим TUN — требует.", "Windows 10 or later. The portable build needs no administrator privileges; TUN mode does.") }}</p></li>
      <li class="pcard" data-mg><h3>macOS</h3><span class="fmt">DMG</span><div class="arch"><span>Apple silicon</span><span>Intel</span></div>
        <p>{{ t("Сборка не из App Store: при первом запуске откройте её через контекстное меню → «Открыть».", "This build is outside the App Store. On first launch, use the context menu → Open.") }}</p></li>
      <li class="pcard" data-mg><h3>Linux</h3><span class="fmt">AppImage, DEB, RPM, pacman</span><div class="arch"><span>x64</span><span>ARM64</span></div>
        <p>{{ t("AppImage запускается без установки — не забудьте", "AppImage runs without installation. Remember to run") }} <code>chmod +x</code>{{ t(". DEB и RPM ставят службу TUN сами.", ". DEB and RPM install the TUN service automatically.") }}</p></li>
      <li class="pcard" data-mg><h3>Android</h3><span class="fmt">APK</span><div class="arch"><span>arm64-v8a</span><span>armeabi-v7a</span><span>x86_64</span></div>
        <p>{{ t("Для большинства телефонов —", "For most phones, choose") }} <code>arm64-v8a</code>{{ t(". Есть плитка в шторке, виджеты и Always-on VPN.", ". Includes a Quick Settings tile, widgets and Always-on VPN.") }}</p></li>
    </ul>
    <p class="note" style="margin-top:16px"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 4v4.5m0 2.6v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>{{ t("Сборки для iOS нет: App Store не пускает клиенты такого рода без отдельной программы разработчика.", "There is no iOS build: the App Store does not accept this kind of client without a separate developer program.") }}</p>
  </div>
</div></section>

<section class="sub-sec" id="verify-sec"><div class="wrap two">
  <div class="sec-head">
    <h2 data-words>{{ t("Скачали — проверьте.", "Downloaded it? Verify it.") }}</h2>
    <p class="lede" data-fade>{{ t("В каждом релизе лежит SHA256SUMS. Тридцать секунд на проверку стоят того: подменённый клиент — худшее, что может случиться с вашим трафиком.", "Every release includes SHA256SUMS. Thirty seconds of verification are worthwhile: a tampered client is the last thing you want handling your traffic.") }}</p>
  </div>
  <ChecksumVerify />
</div></section>

<section class="sub-sec" id="source"><div class="wrap two">
  <div class="sec-head">
    <h2 data-words>{{ t("Не ждать релиза — собрать самому.", "Build it yourself without waiting for a release.") }}</h2>
    <p class="lede" data-fade>{{ t("Самый честный способ доверять клиенту: вы видите, что собираете.", "A direct way to trust your client: see what you build.") }}</p>
  </div>
  <div>
    <ul class="chips-list">
      <li>{{ t("Flutter (канал stable) и Go — ядро mihomo собирается из исходников.", "Flutter (stable channel) and Go: the mihomo core is built from source.") }}</li>
      <li>{{ t("Windows: GCC и Inno Setup для установщика.", "Windows: GCC and Inno Setup for the installer.") }}</li>
      <li>{{ t("macOS: Node.js для appdmg.", "macOS: Node.js for appdmg.") }}</li>
      <li>{{ t("Linux: пакетчик попросит права администратора, чтобы доставить нативные зависимости.", "Linux: the packager requests administrator privileges to install native dependencies.") }}</li>
    </ul>
    <div class="term">
      <div class="th"><h3>{{ t("Сборка", "Build") }}</h3><button class="btn btn-ghost btn-s" type="button" data-copy="#t-build" :data-label="t('Копировать', 'Copy')"><span class="btn-label">{{ t("Копировать", "Copy") }}</span></button></div>
<pre id="t-build"><CodeLines :code="buildScript" lang="shell" /></pre>
    </div>
    <p class="muted" style="margin-top:16px">{{ t("Подробности — в", "Details are in the") }} <SiteLink class="tlink" to="https://github.com/Hoxiee/ReClash/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</SiteLink>.</p>
  </div>
</div></section>

<section class="sub-sec"><div class="wrap">
  <div class="next" data-group data-items=".path" data-cpull="0.025">
    <SiteLink class="path" data-mg :to="pagePath(language, 'start')" style="min-height:240px"><span class="mg-c" style="display:grid;gap:12px"><span class="who">{{ t("Поставили?", "Installed it?") }}</span><h3>{{ t("Быстрый старт и FAQ", "Quick start and FAQ") }}</h3></span>
      <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Открыть", "Open") }}</span></SiteLink>
    <SiteLink class="path" data-mg :to="pagePath(language, 'docs')" style="min-height:240px"><span class="mg-c" style="display:grid;gap:12px"><span class="who">{{ t("Вы провайдер?", "Are you a provider?") }}</span><h3>{{ t("Заголовки для провайдеров", "Headers for providers") }}</h3></span>
      <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Открыть", "Open") }}</span></SiteLink>
  </div>
</div></section>
</div>
</template>
