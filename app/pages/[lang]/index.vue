<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
usePageMeta('index')
const { language, t } = useText()
const manifesto = computed(() => [
  t('Ядро mihomo целиком.', 'The full mihomo core.'),
  t('Режим «Авто» сам держит рабочий узел.', 'Auto mode keeps a working node.'),
  t('Открытый код на четырёх платформах.', 'Open source on four platforms.'),
].join(' ').split(' '))
</script>

<template>
<div>
<!-- ============ HERO ============ -->
<section class="hero" aria-labelledby="hero-title">
  <div class="hero-stage">
    <div class="hero-glow" aria-hidden="true"></div>
    <svg class="hero-svg" aria-hidden="true">
      <defs>
        <linearGradient id="ringG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style="stop-color:var(--brand-2)"/>
          <stop offset=".5" style="stop-color:var(--brand)"/>
          <stop offset="1" style="stop-color:var(--brand-3)"/>
        </linearGradient>
      </defs>
      <circle class="orbit" r="0"/>
      <circle class="ticks" r="0"/>
      <path class="ring" fill="none" stroke="url(#ringG)" stroke-linejoin="round"/>
      <g class="pnodes">
        <g class="pnode"><circle class="halo" r="16"/><circle class="dot" r="6"/><text dy="5">Windows</text></g>
        <g class="pnode"><circle class="halo" r="16"/><circle class="dot" r="6"/><text dy="5">macOS</text></g>
        <g class="pnode"><circle class="halo" r="16"/><circle class="dot" r="6"/><text dy="5">Linux</text></g>
        <g class="pnode"><circle class="halo" r="16"/><circle class="dot" r="6"/><text dy="5">Android</text></g>
      </g>
    </svg>

    <div class="hero-copy">
      <div class="wrap">
        <div class="hero-tags">
          <SiteLink class="tag" to="https://github.com/Hoxiee/ReClash"><span class="pulse" aria-hidden="true"></span>{{ t("В активной разработке", "In active development") }}</SiteLink>
          <span class="tag">{{ t("Форк FlClash", "FlClash fork") }}</span>
          <span class="tag">{{ t("Ядро mihomo", "mihomo core") }}</span>
          <span class="tag">GPL-3.0</span>
        </div>
        <h1 class="hero-h1" id="hero-title">
          <span class="sr-only">{{ t("Свобода, которую нельзя отобрать, купить, отозвать или выключить.", "Freedom that cannot be taken, bought, revoked or switched off.") }}</span>
          <span aria-hidden="true">
            <span class="hl"><span class="t">{{ t("Свобода,", "Freedom,") }}</span></span>
            <span class="hl"><span class="t">{{ t("которую нельзя", "that cannot be") }}</span></span>
            <span class="hl"><span class="slot" :data-words="t('отобрать|купить|отозвать|выключить', 'taken|bought|revoked|switched off')"><span class="slot-in">{{ t("отобрать", "taken") }}</span></span><span class="hero-dot">.</span></span>
          </span>
        </h1>
        <p class="hero-sub">{{ t("Полное ядро mihomo и режим «Авто»: клиент сам держит рабочий узел под вашу сеть и переключается, когда она меняется. Открытый код на Windows, macOS, Linux и Android.", "The full mihomo core and Auto mode: the client keeps a working node for your network and switches when it changes. Open source on Windows, macOS, Linux and Android.") }}</p>
        <div class="hero-cta">
          <SiteLink class="btn btn-primary" :to="pagePath(language, 'download')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ t("Скачать ReClash", "Download ReClash") }}
          </SiteLink>
          <SiteLink class="btn btn-ghost" to="#setup">{{ t("Как подключиться", "How to connect") }}</SiteLink>
        </div>
      </div>
    </div>

    <div class="hero-manifesto">
      <p>
        <template v-for="(word, index) in manifesto" :key="index"><span class="mw">{{ word }}</span>{{ index < manifesto.length - 1 ? ' ' : '' }}</template>
      </p>
    </div>

    <div class="hero-cue" aria-hidden="true"><i></i>{{ t("Листайте", "Scroll") }}</div>
  </div>
</section>

<!-- ============ WHAT IT IS ============ -->
<section class="sec" id="about" aria-labelledby="about-title">
  <div class="wrap lineage">
    <div class="lineage-copy">
      <h2 id="about-title" data-words>{{ t("Форк FlClash на ядре mihomo.", "A FlClash fork powered by mihomo.") }}</h2>
      <p class="lede" data-fade>{{ t("Маршрутизацию делает то же ядро mihomo, что и в Clash.Meta. ReClash добавляет сверху то, чего не хватало: оформление от провайдера, умную маршрутизацию, встроенный обход DPI и заново собранную панель.", "Routing uses the same mihomo core as Clash.Meta. ReClash adds provider branding, smart routing, built-in DPI bypass and a rebuilt dashboard.") }}</p>
      <p class="lineage-note" data-fade style="--d:120ms">{{ t("Проект не аффилирован с FlClash, mihomo или FlClashX.", "The project is not affiliated with FlClash, mihomo or FlClashX.") }} <SiteLink class="tlink" :to="pagePath(language, 'start') + '#faq-flclash'">{{ t("Чем отличается от FlClash", "How it differs from FlClash") }}</SiteLink></p>
    </div>

    <div class="stack">
      <svg class="stack-svg" viewBox="0 0 320 360" aria-hidden="true">
        <defs>
          <linearGradient id="slabGrad" x1="30" y1="94" x2="290" y2="94" gradientUnits="userSpaceOnUse">
            <stop offset="0" style="stop-color:var(--brand-2)"/><stop offset=".5" style="stop-color:var(--brand)"/><stop offset="1" style="stop-color:var(--brand-3)"/>
          </linearGradient>
        </defs>
        <g class="slab slab-0">
          <path class="l" d="M30 262L160 324L160 350L30 288Z"/><path class="r" d="M160 324L290 262L290 288L160 350Z"/>
          <path class="top" d="M160 200L290 262L160 324L30 262Z"/>
          <ellipse cx="160" cy="262" rx="62" ry="29" fill="none" stroke="oklch(1 0 0 / .18)" stroke-dasharray="2 6" stroke-linecap="round" stroke-width="2"/>
        </g>
        <g class="slab slab-1">
          <path class="l" d="M30 178L160 240L160 266L30 204Z"/><path class="r" d="M160 240L290 178L290 204L160 266Z"/>
          <path class="top" d="M160 116L290 178L160 240L30 178Z"/>
          <path d="M112 178L160 155L208 178L160 201Z" fill="none" stroke="oklch(1 0 0 / .22)" stroke-width="2" stroke-linejoin="round"/>
        </g>
        <g class="slab slab-2">
          <path class="l" d="M30 94L160 156L160 182L30 120Z"/><path class="r" d="M160 156L290 94L290 120L160 182Z"/>
          <path class="top" d="M160 32L290 94L160 156L30 94Z"/>
          <ellipse cx="160" cy="94" rx="56" ry="26" fill="none" stroke="var(--on-brand)" stroke-width="6" opacity=".55"/>
          <ellipse cx="160" cy="94" rx="10" ry="5" fill="var(--on-brand)" opacity=".7"/>
        </g>
      </svg>
      <ul class="stack-list" data-group data-items="li" data-cpull="0.05">
        <li data-mg data-layer="2" tabindex="0"><span class="mg-c"><b>ReClash</b><span class="s">{{ t("Темы провайдера, умная маршрутизация, обход DPI, новая панель", "Provider themes, smart routing, DPI bypass, a new dashboard") }}</span></span></li>
        <li data-mg data-layer="1" tabindex="0"><span class="mg-c"><b>FlClash</b><span class="s">{{ t("Кроссплатформенная основа на Flutter", "A cross-platform foundation built with Flutter") }}</span></span></li>
        <li data-mg data-layer="0" tabindex="0"><span class="mg-c"><b>mihomo</b><span class="s">{{ t("Ядро маршрутизации: правила, группы, GeoIP, fake-ip", "Routing core: rules, groups, GeoIP, fake-ip") }}</span></span></li>
      </ul>
    </div>
  </div>
</section>

<!-- ============ FEATURES ============ -->
<section class="sec" id="features" aria-labelledby="feat-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="feat-title" data-words>{{ t("Что умеет ReClash.", "What ReClash can do.") }}</h2>
    </div>
    <ul class="feats" data-group data-items=".feat" data-cpull="0.03">
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-core" viewBox="0 0 64 64" aria-hidden="true">
          <g class="orb">
            <ellipse class="s draw" pathLength="1" cx="32" cy="32" rx="26" ry="10" transform="rotate(-32 32 32)"/>
            <ellipse class="s draw dim" pathLength="1" cx="32" cy="32" rx="26" ry="10" transform="rotate(32 32 32)" style="--d:.15s"/>
            <circle class="f" cx="54" cy="18.4" r="3"/>
          </g>
          <circle class="f nuc" cx="32" cy="32" r="7"/>
        </svg>
        <h3>{{ t("Ядро mihomo целиком", "The full mihomo core") }}</h3>
        <p>{{ t("Правила, группы, провайдеры прокси, GeoIP и GeoSite, fake-ip, внешние контроллеры — всё, к чему вы привыкли в Clash.Meta.", "Rules, groups, proxy providers, GeoIP and GeoSite, fake-ip, external controllers: everything you know from Clash.Meta.") }}</p>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-auto" viewBox="0 0 64 64" aria-hidden="true">
          <path class="s r1" pathLength="1" d="M12 48C28 48 36 16 52 16"/>
          <path class="b r2" pathLength="1" d="M12 48L12 30Q12 16 26 16L52 16"/>
          <path class="b x" d="M28 28l8 8M36 28l-8 8"/>
          <circle class="f" cx="12" cy="48" r="4"/><circle cx="52" cy="16" r="4" fill="var(--fg)"/>
        </svg>
        <h3>{{ t("Умная маршрутизация", "Smart routing") }}</h3>
        <p>{{ t("Режим «Авто» сам держит рабочий узел под текущую сеть и переключается, когда она меняется, — начиная с регионального пресета.", "Auto mode keeps a working node for your current network and switches when it changes, starting with a regional preset.") }}</p>
        <SiteLink class="tlink" :to="pagePath(language, 'start') + '#faq-smart'">{{ t("Как работает «Авто»", "How Auto works") }}</SiteLink>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-prov" viewBox="0 0 64 64" aria-hidden="true">
          <rect class="f fill" x="16" y="30" width="32" height="22" rx="6" opacity=".9"/>
          <rect class="s draw" pathLength="1" x="14" y="28" width="36" height="26" rx="8"/>
          <path class="f drop" d="M32 4C32 4 25 12 25 16.5a7 7 0 0 0 14 0C39 12 32 4 32 4Z"/>
        </svg>
        <h3>{{ t("Вид задаёт провайдер", "Providers set the look") }}</h3>
        <p>{{ t("Один заголовок в ответе подписки — и приложение перекрашивается под бренд: цвет, фон, кольцо подключения и логотип.", "One subscription response header brings your brand to the app: its accent, background, connection ring and logo.") }}</p>
        <SiteLink class="tlink" to="#providers">{{ t("Попробовать на этой странице", "Try it on this page") }}</SiteLink>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-dpi" viewBox="0 0 64 64" aria-hidden="true">
          <path class="s" d="M42 8v17M42 39v17"/>
          <path class="s dim" d="M6 32h52" stroke-dasharray="2 5"/>
          <rect class="f pa" x="8" y="26" width="11" height="12" rx="3"/>
          <rect class="b pb" x="20" y="26" width="11" height="12" rx="3"/>
        </svg>
        <h3>{{ t("Встроенный обход DPI", "Built-in DPI bypass") }}</h3>
        <p>{{ t("Разбивает и маскирует handshake ещё до прокси. Включается в настройках, когда провайдер режет само соединение по DPI.", "Splits and disguises the handshake before the proxy. Enable it in settings when your ISP blocks the connection through DPI.") }}</p>
        <SiteLink class="tlink" :to="pagePath(language, 'start') + '#faq-dpi'">{{ t("Как работает обход", "How bypass works") }}</SiteLink>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-scope" viewBox="0 0 64 64" aria-hidden="true">
          <rect class="s draw" pathLength="1" x="8" y="10" width="48" height="38" rx="7"/>
          <path class="s" d="M24 56h16"/>
          <rect class="f all" x="13" y="15" width="38" height="28" rx="4" opacity=".35"/>
          <rect class="s app" x="36" y="30" width="11" height="9" rx="2.5"/>
          <rect class="s app" x="22" y="30" width="11" height="9" rx="2.5"/>
        </svg>
        <h3>{{ t("Весь трафик или только приложения", "All traffic or selected apps") }}</h3>
        <p>{{ t("Режим TUN заворачивает всю систему, системный прокси — только приложения, которые его поддерживают. Переключается на главном экране.", "TUN routes the entire system; the system proxy covers apps that support it. Switch modes on the main screen.") }}</p>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-meter" viewBox="0 0 64 64" aria-hidden="true">
          <path class="s dim" d="M12 46A21 21 0 1 1 52 46"/>
          <path class="b arc" pathLength="1" d="M12 46A21 21 0 1 1 52 46"/>
          <path class="s" d="M24 56h16"/>
          <circle class="f" cx="32" cy="38" r="3.5"/>
        </svg>
        <h3>{{ t("Трафик и срок на виду", "Traffic and expiry at a glance") }}</h3>
        <p>{{ t("Клиент читает остаток трафика и дату окончания прямо из подписки и держит их на главном экране — без захода в личный кабинет.", "The client reads remaining traffic and expiry directly from your subscription and shows them on the main screen, without visiting your account page.") }}</p>
      </li>
    </ul>
  </div>
</section>

<!-- ============ SETUP ============ -->
<section class="sec" id="setup" aria-labelledby="setup-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="setup-title" data-words>{{ t("Настройка — одна ссылка и три шага.", "One link and three steps to get set up.") }}</h2>
      <p class="lede" data-fade>{{ t("Подписку вы приносите свою. Ни аккаунта, ни регистрации, ни почты.", "Bring your own subscription. No account, registration or email.") }}</p>
    </div>
    <div class="setup">
      <ol class="steps">
        <li class="step"><span class="step-n">1</span><div><h3>{{ t("Поставьте клиент", "Install the client") }}</h3><p>{{ t("Windows, macOS, Linux или Android. Установщик или портативная сборка — как удобнее.", "Windows, macOS, Linux or Android. Choose an installer or a portable build.") }}</p></div></li>
        <li class="step"><span class="step-n">2</span><div><h3>{{ t("Добавьте подписку одной ссылкой", "Add a subscription with one link") }}</h3><p>{{ t("Ссылка от провайдера приносит профиль, серверы и правила разом. Заполнять руками нечего.", "Your provider's link brings the profile, servers and rules together. No manual setup.") }}</p></div></li>
        <li class="step"><span class="step-n">3</span><div><h3>{{ t("Подключитесь", "Connect") }}</h3><p>{{ t("TUN — для всего устройства, системный прокси — для приложений, которые его поддерживают. Режим всегда можно сменить на главном экране.", "TUN covers the whole device; the system proxy covers apps that support it. You can change modes on the main screen at any time.") }}</p></div></li>
      </ol>

      <ImportLink data-fade :title="t('Уже есть ссылка на подписку?', 'Already have a subscription link?')" :text="t('Вставьте её — получите ссылку, которая открывает ReClash и импортирует профиль одним касанием. Такую же кнопку провайдер может положить в личный кабинет.', 'Paste it to get a link that opens ReClash and imports the profile in one tap. Providers can put the same button on their account page.')" />
    </div>
  </div>
</section>

<!-- ============ PROVIDERS ============ -->
<section class="sec" id="providers" aria-labelledby="prov-title">
  <div class="wrap prov">
    <div class="prov-copy">
      <h2 id="prov-title" data-words>{{ t("Ваше приложение. Писать его не нужно.", "Your app, without writing one.") }}</h2>
      <p class="lede" data-fade>{{ t("Никаких SDK, плагинов и договорённостей. Несколько HTTP-заголовков в ответе подписки — и клиент у пользователя показывает ваш логотип, цвет, остаток трафика и кнопку продления.", "No SDKs, plugins or agreements. A few HTTP headers in the subscription response give users your logo, color, remaining traffic and a renewal button.") }}</p>
      <p class="muted" data-fade style="--d:100ms">{{ t("Конструктор сразу отдаёт готовые артефакты для панели Remnawave, а", "The builder provides ready-to-use artifacts for Remnawave, and") }} <SiteLink class="tlink" :to="pagePath(language, 'mock-subs')">{{ t("мок-подписки", "mock subscriptions") }}</SiteLink> {{ t("помогут проверить результат.", "help you test the result.") }}</p>
      <div class="row" data-fade style="--d:180ms">
        <SiteLink class="btn btn-primary" :to="pagePath(language, 'builder')">{{ t("Собрать заголовки", "Build headers") }}</SiteLink>
        <SiteLink class="btn btn-ghost" :to="pagePath(language, 'docs')">{{ t("Открыть документацию", "Open documentation") }}</SiteLink>
      </div>
    </div>

    <div class="studio" id="studio" data-fade>
      <span class="ripple" aria-hidden="true"></span>
      <div class="studio-top">
        <span class="lbl" id="sw-lbl">{{ t("Цвет бренда — сайт перекрасится вместе с превью", "Brand color: the site changes along with the preview") }}</span>
        <div class="swatches" role="group" aria-labelledby="sw-lbl" data-group data-sticky data-items=".sw" data-cpull="0">
          <button class="sw" type="button" data-mg data-hex="FF7A2F" style="--c:#FF7A2F" :aria-label="t('Оранжевый, цвет ReClash', 'Orange, the ReClash color')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="7C5CFF" style="--c:#7C5CFF" :aria-label="t('Фиолетовый', 'Purple')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="3EE8FF" style="--c:#3EE8FF" :aria-label="t('Бирюзовый', 'Cyan')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="C8FF3D" style="--c:#C8FF3D" :aria-label="t('Лаймовый', 'Lime')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="FF3D7F" style="--c:#FF3D7F" :aria-label="t('Малиновый', 'Pink')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="2FD08A" style="--c:#2FD08A" :aria-label="t('Зелёный', 'Green')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="FFC53D" style="--c:#FFC53D" :aria-label="t('Жёлтый', 'Yellow')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="9AA0B4" style="--c:#9AA0B4" :aria-label="t('Нейтральный серый', 'Neutral gray')"><i></i></button>
          <label class="sw sw-custom" data-mg :aria-label="t('Свой цвет', 'Custom color')"><i></i><input type="color" value="#ff7a2f"></label>
        </div>
        <div class="studio-name">
          <label class="sr-only" for="svc-name">{{ t("Имя сервиса", "Service name") }}</label>
          <input class="input" id="svc-name" type="text" maxlength="32" :placeholder="t('Имя сервиса', 'Service name')" value="ReClash" autocomplete="off">
        </div>
      </div>
      <div class="studio-body">
<pre class="http" :aria-label="t('Ответ подписки', 'Subscription response')"><span class="line"><span class="k">HTTP/2 200</span></span><span class="line"><span class="k">subscription-userinfo:</span> <span class="v">upload=0; download=66571993088; total=214748364800</span></span><span class="line" data-line="name"><span class="rk">reclash-servicename:</span> <span class="v">ReClash</span></span><span class="line" data-line="hex"><span class="rk">reclash-hex:</span> <span class="v">FF7A2F</span></span><span class="line"><span class="rk">reclash-announce:</span> <span class="v">{{ t("Профиль импортирован по ссылке.", "Profile imported from a link.") }}</span></span><span class="line"><span class="rk">reclash-buyplan:</span> <span class="v">https://sub.example/renew</span></span></pre>
        <div class="preview">
          <span class="preview-cap">{{ t("Карточка подписки в клиенте", "Subscription card in the client") }}</span>
          <div class="subcard">
            <div class="sc-head">
              <span class="sc-logo" aria-hidden="true">R</span>
              <div style="min-width:0"><div class="sc-name">ReClash</div><div class="sc-sub">{{ t("Профиль из ссылки", "Profile from a link") }}</div></div>
            </div>
            <div class="sc-ann"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3.2v4.1m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>{{ t("Профиль импортирован по ссылке.", "Profile imported from a link.") }}</div>
            <div class="sc-traffic">
              <div class="sc-row"><span>{{ t("Трафик", "Traffic") }}</span><b>{{ t("62 / 200 ГБ", "62 / 200 GB") }}</b></div>
              <div class="sc-bar"><i></i></div>
            </div>
            <div class="sc-btn">{{ t("Продлить", "Renew") }}</div>
          </div>
        </div>
      </div>
      <div class="studio-foot">
        <span>{{ t("Приближение: точные оттенки приложение считает по схеме Material.", "Approximation: the app calculates exact shades using the Material scheme.") }}</span>
        <button class="linkbtn" type="button" data-reset>{{ t("Вернуть цвет ReClash", "Restore the ReClash color") }}</button>
      </div>
    </div>
  </div>
</section>

<!-- ============ PLATFORMS ============ -->
<section class="sec" id="platforms" aria-labelledby="plat-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="plat-title" data-words>{{ t("Работает на четырёх платформах.", "Runs on four platforms.") }}</h2>
    </div>
    <ul class="plats" data-group data-items=".plat" data-cpull="0.03">
      <li class="plat" data-mg><h3>Windows</h3><ul><li>{{ t("Windows 10 и новее", "Windows 10 or later") }}</li><li>{{ t("Установщик и портативная сборка", "Installer and portable build") }}</li><li>{{ t("TUN и системный прокси", "TUN and system proxy") }}</li></ul></li>
      <li class="plat" data-mg><h3>macOS</h3><ul><li>{{ t("Intel и Apple Silicon", "Intel and Apple Silicon") }}</li><li>{{ t("DMG-образ", "DMG image") }}</li><li>{{ t("TUN через системного помощника", "TUN through a system helper") }}</li></ul></li>
      <li class="plat" data-mg><h3>Linux</h3><ul><li>AppImage, deb, rpm</li><li>{{ t("x86_64 и arm64", "x86_64 and arm64") }}</li><li>{{ t("TUN и системный прокси", "TUN and system proxy") }}</li></ul></li>
      <li class="plat" data-mg><h3>Android</h3><ul><li>{{ t("Android 6 и новее", "Android 6 or later") }}</li><li>{{ t("APK по архитектурам", "APKs for each architecture") }}</li><li>{{ t("Режим VPN-сервиса", "VPN service mode") }}</li></ul></li>
    </ul>
    <p class="plats-foot" data-fade>{{ t("Актуальные файлы всегда на", "Current files are always on the") }} <SiteLink class="tlink" :to="pagePath(language, 'download')">{{ t("странице загрузок", "download page") }}</SiteLink>.</p>
  </div>
</section>

<!-- ============ HONEST ============ -->
<section class="sec" id="honest" aria-labelledby="honest-title">
  <div class="wrap honest">
    <div class="sec-head" style="margin:0">
      <h2 id="honest-title" data-words>{{ t("Уйти можно когда угодно.", "Leave whenever you want.") }}</h2>
      <p class="lede" data-fade>{{ t("Ни аккаунта, ни привязки. Серверы и профили ваши, а подписка в обычном формате Clash уносится в любой совместимый клиент. ReClash открыт целиком — ничто не держит вас здесь.", "No account or lock-in. Your servers and profiles belong to you, and a standard Clash subscription works with any compatible client. ReClash is fully open source: nothing keeps you here.") }}</p>
    </div>
    <svg class="chain" viewBox="0 0 460 200" aria-hidden="true" data-reveal>
      <path class="lk lk-a" d="M60 65H140A35 35 0 0 1 140 135H60A35 35 0 0 1 60 65Z"/>
      <g class="free"><path class="lk lk-c" d="M300 65H380A35 35 0 0 1 380 135H300A35 35 0 0 1 300 65Z"/></g>
      <path class="lk lk-b" pathLength="100" style="stroke-dashoffset:56.5" d="M180 65H260A35 35 0 0 1 260 135H180A35 35 0 0 1 180 65Z"/>
    </svg>
  </div>
</section>

<!-- ============ NEXT ============ -->
<section class="sec" id="next" aria-labelledby="next-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="next-title" data-words>{{ t("Дальше — смотря кто вы.", "What comes next depends on you.") }}</h2>
    </div>
    <div class="next" data-group data-items=".path" data-cpull="0.025">
      <SiteLink class="path" data-mg :to="pagePath(language, 'download')">
        <svg class="blob" viewBox="0 0 150 150" aria-hidden="true"><path/></svg>
        <span class="mg-c" style="display:grid;gap:16px">
          <span class="who">{{ t("У вас есть ссылка", "You have a link") }}</span>
          <h3>{{ t("Вставьте ссылку и подключитесь", "Paste your link and connect") }}</h3>
          <p>{{ t("ReClash откроет ссылку провайдера, покажет остаток трафика и подключит — без аккаунта, регистрации и почты.", "ReClash opens your provider's link, shows remaining traffic and connects, without an account, registration or email.") }}</p>
        </span>
        <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Скачать ReClash", "Download ReClash") }}</span>
      </SiteLink>
      <SiteLink class="path" data-mg :to="pagePath(language, 'builder')">
        <svg class="blob" viewBox="0 0 150 150" aria-hidden="true"><path/></svg>
        <span class="mg-c" style="display:grid;gap:16px">
          <span class="who">{{ t("Вы продаёте доступ", "You sell access") }}</span>
          <h3>{{ t("Сделайте клиент своим", "Make the client your own") }}</h3>
          <p>{{ t("Несколько заголовков в ответе подписки — и приложение носит ваш логотип, цвет и кнопку продления. Своего приложения не нужно.", "A few subscription response headers bring your logo, color and renewal button to the app. No need to build your own client.") }}</p>
        </span>
        <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Собрать заголовки", "Build headers") }}</span>
      </SiteLink>
    </div>
  </div>
</section>
</div>
</template>
