<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import '~/assets/css/download.css'
usePageMeta('download')
const { language, t } = useText()
// One GitHub request feeds both the file picker and the changelog.
const releases = useReleases()
const buildScript = computed(() => [
  'git clone --recurse-submodules --branch dev https://github.com/Hoxiee/ReClash.git',
  'cd ReClash',
  'flutter pub get',
  `dart run setup.dart            ${t('# хост-платформа', '# host platform', '# 宿主平台')}`,
  'dart run setup.dart android    # APK',
  '# → dist/',
].join('\n'))
</script>

<template>
<div>
<section class="ph"><div class="wrap ph-grid">
  <div>
    <h1 data-words>{{ t("Скачайте или соберите сами.", "Download or build it yourself.", "下载，或自行构建。") }}</h1>
    <p class="lede" data-fade>{{ t("Список файлов последнего релиза приходит прямо из GitHub. Ниже — что под какой системой, проверка SHA256 и сборка из исходников.", "The latest release files come directly from GitHub. Below: packages for each system, SHA256 verification and building from source.", "最新发行版的文件直接来自 GitHub。下文包括：各系统的安装包、SHA256 校验和从源码构建。") }}</p>
    <div class="ph-tags" data-fade style="--d:120ms"><span class="tag">GPL-3.0</span><span class="tag">{{ t("Четыре платформы", "Four platforms", "四个平台") }}</span><span class="tag">{{ t("SHA256 в каждом релизе", "SHA256 in every release", "每个发行版都附带 SHA256") }}</span></div>
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
    <h2 data-words>{{ t("Что нового.", "What's new.", "更新内容。") }}</h2>
    <p class="lede" data-fade>{{ t("Заметки к релизам приходят из GitHub вместе со списком файлов: сначала текущий, ниже — предыдущие.", "Release notes come from GitHub with the file list: the current release first, earlier ones below.", "发行说明与文件列表一同来自 GitHub：当前发行版在前，较早的在下。") }}</p>
  </div>
  <ReleaseNotes :feed="releases" />
</div></section>

<section class="sub-sec" id="platforms"><div class="wrap two">
  <div class="sec-head"><h2 data-words>{{ t("Что под какой системой.", "Packages for each system.", "各系统的安装包。") }}</h2></div>
  <div>
    <ul class="pcards" data-group data-items=".pcard" data-cpull="0.03">
      <li class="pcard" data-mg><h3>Windows</h3><span class="fmt">{{ t("Установщик или портативный ZIP", "Installer or portable ZIP", "安装程序或便携版 ZIP") }}</span><div class="arch"><span>x64</span><span>ARM64</span></div>
        <p>{{ t("Windows 10 и новее. Установщик ставит приложение для текущего пользователя: оно обновляется само в фоне и не запрашивает прав. Портативная сборка обновляется вручную. Режиму TUN нужны права администратора.", "Windows 10 or later. The installer sets up the app for the current user, and it updates itself in the background without asking for privileges. The portable build updates by hand. TUN mode needs administrator privileges.", "Windows 10 或更高版本。安装程序为当前用户安装应用，应用会在后台自行更新，无需请求权限。便携版需手动更新。TUN 模式需要管理员权限。") }}</p></li>
      <li class="pcard" data-mg><h3>macOS</h3><span class="fmt">DMG</span><div class="arch"><span>Apple silicon</span><span>Intel</span></div>
        <p>{{ t("Сборка не из App Store: при первом запуске откройте её через контекстное меню → «Открыть». Дальше приложение обновляется само, если ему доступна запись в свою папку.", "This build is outside the App Store. On first launch, use the context menu → Open. After that it updates itself, provided it can write to its own folder.", "此版本不在 App Store 中分发。首次启动时，请使用右键菜单 → “打开”。此后，只要应用能写入自己所在的文件夹，就会自行更新。") }}</p></li>
      <li class="pcard" data-mg><h3>Linux</h3><span class="fmt">AppImage, DEB, RPM, pacman</span><div class="arch"><span>x64</span><span>ARM64</span></div>
        <p>{{ t("AppImage доступен для x64 — перед запуском выполните", "AppImage is available for x64; before launching, run", "AppImage 适用于 x64；启动前请运行") }} <code>chmod +x</code>{{ t(". Для ARM64 доступны DEB, RPM и pacman. AppImage обновляется сам, остальные пакеты — через менеджер пакетов. Для TUN установите системного помощника из приложения.", ". ARM64 packages are DEB, RPM and pacman. The AppImage updates itself; the other packages update through your package manager. Install the system helper from the app to use TUN.", "。ARM64 的安装包为 DEB、RPM 和 pacman。AppImage 会自行更新；其他安装包通过软件包管理器更新。要使用 TUN，请从应用中安装系统助手。") }}</p></li>
      <li class="pcard" data-mg><h3>Android</h3><span class="fmt">APK</span><div class="arch"><span>arm64-v8a</span><span>armeabi-v7a</span><span>x86_64</span></div>
        <p>{{ t("Для большинства телефонов —", "For most phones, choose", "大多数手机请选择") }} <code>arm64-v8a</code>{{ t(". Есть плитка в шторке, виджеты и Always-on VPN.", ". Includes a Quick Settings tile, widgets and Always-on VPN.", "。包含快速设置图块、小组件和 Always-on VPN。") }}</p></li>
    </ul>
    <p class="note" style="margin-top:16px"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 4v4.5m0 2.6v.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>{{ t("Доступны Android, Windows, macOS и Linux. Сборки для iOS нет.", "Android, Windows, macOS and Linux are supported. There is no iOS build.", "支持 Android、Windows、macOS 和 Linux。没有 iOS 版本。") }}</p>
  </div>
</div></section>

<section class="sub-sec" id="verify-sec"><div class="wrap two">
  <div class="sec-head">
    <h2 data-words>{{ t("Скачали — проверьте.", "Downloaded it? Verify it.", "下载完了？请先校验。") }}</h2>
    <p class="lede" data-fade>{{ t("В каждом релизе лежит SHA256SUMS. Тридцать секунд на проверку стоят того: подменённый клиент — худшее, что может случиться с вашим трафиком.", "Every release includes SHA256SUMS. Thirty seconds of verification are worthwhile: a tampered client is the last thing you want handling your traffic.", "每个发行版都附带 SHA256SUMS。花三十秒校验是值得的：被篡改的客户端是你的流量最不该遇到的事。") }}</p>
  </div>
  <ChecksumVerify />
</div></section>

<section class="sub-sec" id="source"><div class="wrap two">
  <div class="sec-head">
    <h2 data-words>{{ t("Не ждать релиза — собрать самому.", "Build it yourself without waiting for a release.", "无需等待发行版，自行构建。") }}</h2>
    <p class="lede" data-fade>{{ t("Самый честный способ доверять клиенту: вы видите, что собираете.", "A direct way to trust your client: see what you build.", "信任客户端的直接方式：亲眼看到你构建的是什么。") }}</p>
  </div>
  <div>
    <ul class="chips-list">
      <li>{{ t("Flutter 3.47.6 (как в release CI), Go и Rust/Cargo. Ядро mihomo и нативные библиотеки собираются из исходников.", "Flutter 3.47.6 (matching release CI), Go and Rust/Cargo. The mihomo core and native libraries are built from source.", "Flutter 3.47.6（与发行版 CI 一致）、Go 和 Rust/Cargo。mihomo 内核和原生库从源码构建。") }}</li>
      <li>{{ t("Windows: Visual Studio с инструментами C++, GCC и Inno Setup для установщика.", "Windows: Visual Studio C++ tools, GCC and Inno Setup for the installer.", "Windows：Visual Studio C++ 工具、GCC，以及用于生成安装程序的 Inno Setup。") }}</li>
      <li>{{ t("macOS: Xcode и Node.js для appdmg; macOS 12 или новее для запуска.", "macOS: Xcode and Node.js for appdmg; macOS 12 or later to run.", "macOS：Xcode 和用于 appdmg 的 Node.js；运行需要 macOS 12 或更高版本。") }}</li>
      <li>{{ t("Linux: пакетчик попросит права администратора, чтобы доставить нативные зависимости.", "Linux: the packager requests administrator privileges to install native dependencies.", "Linux：打包程序会请求管理员权限以安装原生依赖。") }}</li>
    </ul>
    <div class="term">
      <div class="th"><h3>{{ t("Сборка", "Build", "构建") }}</h3><button class="btn btn-ghost btn-s" type="button" data-copy="#t-build" :data-label="t('Копировать', 'Copy', '复制')"><span class="btn-label">{{ t("Копировать", "Copy", "复制") }}</span></button></div>
<pre id="t-build"><CodeLines :code="buildScript" lang="shell" /></pre>
    </div>
    <p class="muted" style="margin-top:16px">{{ t("Подробности — в", "Details are in the", "详情见") }} <SiteLink class="tlink" to="https://github.com/Hoxiee/ReClash/blob/dev/.agents/commands.md">build commands</SiteLink>.</p>
  </div>
</div></section>

<section class="sub-sec"><div class="wrap">
  <div class="next" data-group data-items=".path" data-cpull="0.025">
    <SiteLink class="path" data-mg :to="pagePath(language, 'start')" style="min-height:240px"><span class="mg-c" style="display:grid;gap:12px"><span class="who">{{ t("Поставили?", "Installed it?", "装好了吗？") }}</span><h3>{{ t("Быстрый старт и FAQ", "Quick start and FAQ", "快速开始与常见问题") }}</h3></span>
      <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Открыть", "Open", "打开") }}</span></SiteLink>
    <SiteLink class="path" data-mg :to="pagePath(language, 'docs')" style="min-height:240px"><span class="mg-c" style="display:grid;gap:12px"><span class="who">{{ t("Вы провайдер?", "Are you a provider?", "你是服务商吗？") }}</span><h3>{{ t("Заголовки для провайдеров", "Headers for providers", "服务商头部说明") }}</h3></span>
      <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Открыть", "Open", "打开") }}</span></SiteLink>
  </div>
</div></section>
</div>
</template>
