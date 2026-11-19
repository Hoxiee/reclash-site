<script setup lang="ts">
import { pagePath } from '~~/shared/site/routes'
import { docPath } from '~~/shared/docs/catalogue'
usePageMeta('index')
const { language, t } = useText()
const manifesto = computed(() => [
  t('На связи с интернетом —', 'In touch with the internet —', '与互联网保持联系，'),
  t('и с тем, кто его даёт.', 'and with whoever provides it.', '也与提供它的人保持联系。'),
  t('Бесплатно, открыто, без рекламы.', 'Free, open, ad-free.', '免费、开源、无广告。'),
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
          <SiteLink class="tag" to="https://github.com/Hoxiee/ReClash"><span class="pulse" aria-hidden="true"></span>{{ t("В активной разработке", "In active development", "积极开发中") }}</SiteLink>
          <span class="tag">{{ t("Бесплатно и без рекламы", "Free and ad-free", "免费无广告") }}</span>
          <span class="tag">{{ t("Открытый код", "Open source", "开源") }}</span>
          <span class="tag">Windows · macOS · Linux · Android</span>
        </div>
        <h1 class="hero-h1" id="hero-title">
          <span class="sr-only">{{ t("ReClash на связи.", "ReClash. In touch.", "ReClash，保持联系。") }}</span>
          <span aria-hidden="true">
            <span class="hl"><span class="t">ReClash</span></span>
            <span class="hl"><span class="slot" :data-words="t('на связи|в курсе', 'in touch|in the loop', '保持联系|随时知情')"><span class="slot-in">{{ t("на связи", "in touch", "保持联系") }}</span></span><span class="hero-dot">.</span></span>
          </span>
        </h1>
        <p class="hero-sub">{{ t("Видно, что открывается, сколько осталось трафика и что сообщает провайдер. Одна ссылка подписки — и всё работает на телефоне, компьютере и телевизоре.", "See what opens, how much traffic is left and what your provider has to say. One subscription link, and it works on your phone, computer and TV.", "看得到哪些网站能打开、还剩多少流量、服务商发来了什么通知。一条订阅链接，手机、电脑和电视都能用。") }}</p>
        <div class="hero-cta">
          <SiteLink class="btn btn-primary" :to="pagePath(language, 'download')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ t("Скачать ReClash", "Download ReClash", "下载 ReClash") }}
          </SiteLink>
          <SiteLink class="btn btn-ghost" to="#setup">{{ t("Как подключиться", "How to connect", "如何连接") }}</SiteLink>
        </div>
      </div>
    </div>

    <div class="hero-manifesto">
      <p>
        <template v-for="(word, index) in manifesto" :key="index"><span class="mw">{{ word }}</span>{{ index < manifesto.length - 1 ? ' ' : '' }}</template>
      </p>
    </div>

    <div class="hero-cue" aria-hidden="true"><i></i>{{ t("Листайте", "Scroll", "向下滚动") }}</div>
  </div>
</section>

<!-- ============ FEATURES ============ -->
<section class="sec" id="features" aria-labelledby="feat-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="feat-title" data-words>{{ t("Что ReClash делает за вас.", "What ReClash does for you.", "ReClash 为你做的事。") }}</h2>
    </div>
    <ul class="feats" data-group data-items=".feat" data-cpull="0.03">
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-auto" viewBox="0 0 64 64" aria-hidden="true">
            <path class="s r1" pathLength="1" d="M12 48C28 48 36 16 52 16"/>
            <path class="b r2" pathLength="1" d="M12 48L12 30Q12 16 26 16L52 16"/>
            <path class="b x" d="M28 28l8 8M36 28l-8 8"/>
            <circle class="f" cx="12" cy="48" r="4"/><circle cx="52" cy="16" r="4" fill="var(--fg)"/>
          </svg>
        <h3>{{ t("ChatGPT не увидит не ту страну", "ChatGPT never sees the wrong country", "ChatGPT 不会看到错误的国家") }}</h3>
        <p>{{ t("Привязка сайтов отправляет выбранные сайты только через выбранные серверы выхода — или никуда, при любом режиме и правилах. Остальной трафик идёт как обычно.", "Site lock sends chosen sites only through the exit servers you pick, or nowhere, whatever the mode or rules. Everything else keeps its usual route.", "网站锁定会让所选网站只经由你指定的出口服务器访问，否则就不连接，不受模式或规则影响。其余流量照常走原有路线。") }}</p>
        <SiteLink class="tlink" :to="docPath(language, 'site-lock')">{{ t("Как это работает", "How it works", "工作原理") }}</SiteLink>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-core" viewBox="0 0 64 64" aria-hidden="true">
            <g class="orb">
              <ellipse class="s draw" pathLength="1" cx="32" cy="32" rx="26" ry="10" transform="rotate(-32 32 32)"/>
              <ellipse class="s draw dim" pathLength="1" cx="32" cy="32" rx="26" ry="10" transform="rotate(32 32 32)" style="--d:.15s"/>
              <circle class="f" cx="54" cy="18.4" r="3"/>
            </g>
            <circle class="f nuc" cx="32" cy="32" r="7"/>
          </svg>
        <h3>{{ t("Не грузит — сразу видно почему", "Won't load? You see why", "打不开？一眼看出原因") }}</h3>
        <p>{{ t("Проверки сервисов показывают, открываются ли Google, YouTube, ChatGPT, Netflix и другие сайты через текущий маршрут и с какой задержкой. Не нужно гадать, виноват сервер или сайт.", "Service checks show whether Google, YouTube, ChatGPT, Netflix and other sites open through the current route, and how fast. No guessing whether the server or the site is to blame.", "服务检测会显示 Google、YouTube、ChatGPT、Netflix 等网站能否通过当前线路打开，以及速度如何。无需猜测是服务器还是网站的问题。") }}</p>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-prov" viewBox="0 0 64 64" aria-hidden="true">
            <rect class="f fill" x="16" y="30" width="32" height="22" rx="6" opacity=".9"/>
            <rect class="s draw" pathLength="1" x="14" y="28" width="36" height="26" rx="8"/>
            <path class="f drop" d="M32 4C32 4 25 12 25 16.5a7 7 0 0 0 14 0C39 12 32 4 32 4Z"/>
          </svg>
        <h3>{{ t("Хватит ли трафика — знаете заранее", "Know if your data will last", "流量够不够，提前知道") }}</h3>
        <p>{{ t("Остаток и срок видны сразу, а прогноз подскажет, хватит ли трафика до конца периода. Вместе с подпиской приходят логотип и объявления сервиса, ссылки на поддержку и продление. Профили лежат стопкой, как карты в кошельке.", "Remaining traffic and expiry are in plain sight, and a forecast tells you whether the data will last the period. The service's logo, announcements, support and renewal links arrive with the subscription. Profiles stack like cards in a wallet.", "剩余流量和到期时间一目了然，预测会告诉你流量能否撑到周期结束。服务商的标志、公告、客服和续费链接会随订阅一同送达。配置像钱包里的卡片一样叠放。") }}</p>
        <SiteLink class="tlink" to="#providers">{{ t("Попробовать на этой странице", "Try it on this page", "在本页试一试") }}</SiteLink>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-meter" viewBox="0 0 64 64" aria-hidden="true">
            <path class="s dim" d="M12 46A21 21 0 1 1 52 46"/>
            <path class="b arc" pathLength="1" d="M12 46A21 21 0 1 1 52 46"/>
            <path class="s" d="M24 56h16"/>
            <circle class="f" cx="32" cy="38" r="3.5"/>
          </svg>
        <h3>{{ t("Одна кнопка или все цифры", "One button or every number", "一个按钮，或全部数据") }}</h3>
        <p>{{ t("По умолчанию — простой экран: кнопка подключения, текущая страна и остаток подписки. Подробная панель из виджетов показывает трафик, IP выхода и его качество, прогноз трафика, тест скорости, соединения и проверки сервисов.", "By default, a simple screen: the connect button, current location and what is left on the subscription. The detailed dashboard adds widgets for traffic, exit IP and its quality, a data forecast, a speed test, connections and service checks.", "默认是简洁界面：连接按钮、当前位置和订阅剩余额度。详细仪表盘则提供流量、出口 IP 及其质量、流量预测、测速、连接和服务检测等小组件。") }}</p>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-scope" viewBox="0 0 64 64" aria-hidden="true">
            <rect class="s draw" pathLength="1" x="8" y="10" width="48" height="38" rx="7"/>
            <path class="s" d="M24 56h16"/>
            <rect class="f all" x="13" y="15" width="38" height="28" rx="4" opacity=".35"/>
            <rect class="s app" x="36" y="30" width="11" height="9" rx="2.5"/>
            <rect class="s app" x="22" y="30" width="11" height="9" rx="2.5"/>
          </svg>
        <h3>{{ t("Дома напрямую, в дороге — через прокси", "Direct at home, proxied on the go", "在家直连，在外走代理") }}</h3>
        <p>{{ t("В доверенных сетях прокси встаёт на паузу, в остальных включается снова. На Android можно выбрать приложения, на компьютере — TUN или системный прокси.", "On networks you trust the proxy pauses, everywhere else it resumes. Android lets you pick apps; desktops use TUN or the system proxy.", "在受信任的网络中代理会暂停，其他网络则自动恢复。Android 上可以选择应用；桌面端使用 TUN 或系统代理。") }}</p>
      </li>
      <li class="feat" data-mg data-reveal>
        <svg class="ico i-dpi" viewBox="0 0 64 64" aria-hidden="true">
            <path class="s" d="M42 8v17M42 39v17"/>
            <path class="s dim" d="M6 32h52" stroke-dasharray="2 5"/>
            <rect class="f pa" x="8" y="26" width="11" height="12" rx="3"/>
            <rect class="b pb" x="20" y="26" width="11" height="12" rx="3"/>
          </svg>
        <h3>{{ t("Если что-то не так — видно что", "When something is off, you see what", "出问题时，看得到原因") }}</h3>
        <p>{{ t("Соединения, DNS-запросы и логи в реальном времени, оценка качества IP выхода и проверка подключения. Лишние пути утечки DNS закрыты.", "Live connections, DNS queries and logs, exit IP quality and a connection check. Extra DNS leak paths are closed.", "实时连接、DNS 查询和日志，出口 IP 质量评估以及连接检测。多余的 DNS 泄漏途径已被堵上。") }}</p>
        <SiteLink class="tlink" :to="pagePath(language, 'start') + '#faq-trouble'">{{ t("Если не подключается", "Connection troubleshooting", "连接故障排查") }}</SiteLink>
      </li>
    </ul>
  </div>
</section>

<!-- ============ SCREENS ============ -->
<section class="sec" id="screens" aria-labelledby="screens-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="screens-title" data-words>{{ t("Посмотрите сами.", "See for yourself.", "亲眼看看。") }}</h2>
    </div>
  </div>
  <ScreenSlider data-fade />
</section>

<!-- ============ COMPARE ============ -->
<section class="sec" id="compare" aria-labelledby="compare-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="compare-title" data-words>{{ t("Чем ReClash отличается от обычного клиента.", "How ReClash differs from a typical client.", "ReClash 与普通客户端有何不同。") }}</h2>
    </div>
    <table class="cmp" data-fade>
      <caption class="sr-only">{{ t("Сравнение ReClash с обычным клиентом по типичным ситуациям", "ReClash compared with a typical client in common situations", "ReClash 与普通客户端在常见场景下的对比") }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ t("Ситуация", "Situation", "场景") }}</th>
          <th scope="col">{{ t("Обычный клиент", "Typical client", "普通客户端") }}</th>
          <th scope="col" class="cmp-us">ReClash</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">{{ t("Сайт пускает только из одной страны", "A site only works from one country", "网站只允许某一个国家访问") }}</th>
          <td :data-label="t('Обычный клиент', 'Typical client', '普通客户端')">{{ t("Следить руками, какой сервер выбран", "Keep an eye on which server is selected", "手动留意当前选了哪个服务器") }}</td>
          <td class="cmp-us" data-label="ReClash">{{ t("Сайт привязан к своим выходам и мимо них не уйдёт", "The site is pinned to its exits and never goes around them", "网站被固定到指定出口，不会绕过它们") }}</td>
        </tr>
        <tr>
          <th scope="row">{{ t("Не открывается сайт", "A site will not open", "网站打不开") }}</th>
          <td :data-label="t('Обычный клиент', 'Typical client', '普通客户端')">{{ t("Непонятно, виноват сервер или сайт", "Hard to tell whether the server or the site is at fault", "难以判断是服务器还是网站的问题") }}</td>
          <td class="cmp-us" data-label="ReClash">{{ t("Проверки сервисов показывают, что открывается через текущий маршрут", "Service checks show what opens through the current route", "服务检测显示哪些网站能通过当前线路打开") }}</td>
        </tr>
        <tr>
          <th scope="row">{{ t("Сколько осталось трафика", "Traffic left", "剩余流量") }}</th>
          <td :data-label="t('Обычный клиент', 'Typical client', '普通客户端')">{{ t("Часто только в настройках профиля", "Often buried in profile settings", "常常藏在配置设置里") }}</td>
          <td class="cmp-us" data-label="ReClash">{{ t("Остаток и срок на главном экране, прогноз — хватит ли до конца", "Remaining traffic and expiry on the main screen, and a forecast of whether it will last", "主界面显示剩余流量和到期时间，并预测能否撑到周期结束") }}</td>
        </tr>
        <tr>
          <th scope="row">{{ t("Домашний Wi-Fi", "Home Wi-Fi", "家庭 Wi-Fi") }}</th>
          <td :data-label="t('Обычный клиент', 'Typical client', '普通客户端')">{{ t("Выключать и включать руками", "Turn it off and on by hand", "手动关闭和开启") }}</td>
          <td class="cmp-us" data-label="ReClash">{{ t("Пауза в доверенных сетях, включение в остальных", "Pauses on trusted networks, resumes elsewhere", "在受信任的网络中暂停，其他网络自动恢复") }}</td>
        </tr>
        <tr>
          <th scope="row">{{ t("Провайдер", "Provider", "服务商") }}</th>
          <td :data-label="t('Обычный клиент', 'Typical client', '普通客户端')">{{ t("Только список серверов", "Just a server list", "只有服务器列表") }}</td>
          <td class="cmp-us" data-label="ReClash">{{ t("Логотип, объявления, поддержка и настройки, которые вы одобряете", "Logo, announcements, support and settings you approve", "标志、公告、客服，以及经你批准的设置") }}</td>
        </tr>
        <tr>
          <th scope="row">{{ t("Цена", "Price", "价格") }}</th>
          <td :data-label="t('Обычный клиент', 'Typical client', '普通客户端')">{{ t("Бывает реклама или платные функции", "Sometimes ads or paid features", "有时有广告或付费功能") }}</td>
          <td class="cmp-us" data-label="ReClash">{{ t("Бесплатно, открытый код, без рекламы", "Free, open source, ad-free", "免费、开源、无广告") }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<!-- ============ SETUP ============ -->
<section class="sec" id="setup" aria-labelledby="setup-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="setup-title" data-words>{{ t("Настройка — одна ссылка и три шага.", "One link and three steps to get set up.", "一条链接，三步完成设置。") }}</h2>
      <p class="lede" data-fade>{{ t("Подписку вы приносите свою. Ни аккаунта, ни регистрации, ни почты.", "Bring your own subscription. No account, registration or email.", "自带订阅即可。无需账号、注册或邮箱。") }}</p>
    </div>
    <div class="setup">
      <ol class="steps">
        <li class="step"><span class="step-n">1</span><div><h3>{{ t("Поставьте клиент", "Install the client", "安装客户端") }}</h3><p>{{ t("Windows, macOS, Linux или Android. Установщик или портативная сборка — как удобнее.", "Windows, macOS, Linux or Android. Choose an installer or a portable build.", "支持 Windows、macOS、Linux 或 Android。可选择安装包或便携版。") }}</p></div></li>
        <li class="step"><span class="step-n">2</span><div><h3>{{ t("Добавьте подписку одной ссылкой", "Add a subscription with one link", "用一条链接添加订阅") }}</h3><p>{{ t("Импортируйте ссылку или файл конфигурации. Поддерживаются профили Clash/mihomo и распространённые ссылки на отдельные узлы; результат можно проверить перед добавлением.", "Import a link or configuration file. Clash/mihomo profiles and common individual-node links are supported, with a review before adding them.", "导入链接或配置文件。支持 Clash/mihomo 配置和常见的单节点链接，添加前可先检查。") }}</p></div></li>
        <li class="step"><span class="step-n">3</span><div><h3>{{ t("Подключитесь", "Connect", "连接") }}</h3><p>{{ t("Выберите профиль и узел, затем запустите подключение. На Android подтвердите разрешение VPN; на компьютере для TUN потребуется системный помощник.", "Choose a profile and node, then start the connection. Approve VPN permission on Android; desktop TUN requires the system helper.", "选择配置和节点，然后开始连接。在 Android 上需批准 VPN 权限；桌面端使用 TUN 需要系统助手。") }}</p></div></li>
      </ol>

      <ImportLink data-fade :title="t('Уже есть ссылка на подписку?', 'Already have a subscription link?', '已经有订阅链接了？')" :text="t('Вставьте её — получите ссылку, которая открывает ReClash и импортирует профиль одним касанием. Такую же кнопку провайдер может положить в личный кабинет.', 'Paste it to get a link that opens ReClash and imports the profile in one tap. Providers can put the same button on their account page.', '粘贴后即可得到一条链接，点一下就能打开 ReClash 并导入配置。服务商也可以把同样的按钮放在用户中心页面。')" />
    </div>
  </div>
</section>

<!-- ============ PROVIDERS ============ -->
<section class="sec" id="providers" aria-labelledby="prov-title">
  <div class="wrap prov">
    <div class="prov-copy">
      <h2 id="prov-title" data-words>{{ t("Ваше приложение. Писать его не нужно.", "Your app, without writing one.", "你的应用，无需自己开发。") }}</h2>
      <p class="lede" data-fade>{{ t("Никаких SDK, плагинов и договорённостей. Один заголовок reclash-config в ответе подписки указывает на манифест — и клиент у пользователя показывает ваш логотип, цвет, объявления, остаток трафика и кнопку продления.", "No SDKs, plugins or agreements. One reclash-config header in the subscription response points to a manifest, and users see your logo, color, announcements, remaining traffic and a renewal button.", "无需 SDK、插件或协议。订阅响应中的一个 reclash-config 头指向清单，用户就能看到你的标志、颜色、公告、剩余流量和续费按钮。") }}</p>
      <p class="muted" data-fade style="--d:100ms">{{ t("Конструктор собирает reclash.yaml и заголовок, который на него указывает, а", "The builder assembles reclash.yaml and the header that points to it, and", "生成器会生成 reclash.yaml 以及指向它的头，而") }} <SiteLink class="tlink" :to="pagePath(language, 'mock-subs')">{{ t("мок-подписки", "mock subscriptions", "模拟订阅") }}</SiteLink> {{ t("помогут проверить результат.", "help you test the result.", "可帮你测试结果。") }}</p>
      <div class="row" data-fade style="--d:180ms">
        <SiteLink class="btn btn-primary" :to="pagePath(language, 'builder')">{{ t("Собрать манифест", "Build the manifest", "生成清单") }}</SiteLink>
        <SiteLink class="btn btn-ghost" :to="pagePath(language, 'docs')">{{ t("Открыть документацию", "Open documentation", "打开文档") }}</SiteLink>
      </div>
    </div>

    <div class="studio" id="studio" data-fade>
      <span class="ripple" aria-hidden="true"></span>
      <div class="studio-top">
        <span class="lbl" id="sw-lbl">{{ t("Цвет бренда — сайт перекрасится вместе с превью", "Brand color: the site changes along with the preview", "品牌颜色：网站会随预览一同变色") }}</span>
        <div class="swatches" role="group" aria-labelledby="sw-lbl" data-group data-sticky data-items=".sw" data-cpull="0">
          <button class="sw" type="button" data-mg data-hex="FF7A2F" style="--c:#FF7A2F" :aria-label="t('Оранжевый, цвет ReClash', 'Orange, the ReClash color', '橙色，ReClash 的颜色')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="7C5CFF" style="--c:#7C5CFF" :aria-label="t('Фиолетовый', 'Purple', '紫色')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="3EE8FF" style="--c:#3EE8FF" :aria-label="t('Бирюзовый', 'Cyan', '青色')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="C8FF3D" style="--c:#C8FF3D" :aria-label="t('Лаймовый', 'Lime', '酸橙色')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="FF3D7F" style="--c:#FF3D7F" :aria-label="t('Малиновый', 'Pink', '粉红色')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="2FD08A" style="--c:#2FD08A" :aria-label="t('Зелёный', 'Green', '绿色')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="FFC53D" style="--c:#FFC53D" :aria-label="t('Жёлтый', 'Yellow', '黄色')"><i></i></button>
          <button class="sw" type="button" data-mg data-hex="9AA0B4" style="--c:#9AA0B4" :aria-label="t('Нейтральный серый', 'Neutral gray', '中性灰')"><i></i></button>
          <label class="sw sw-custom" data-mg :aria-label="t('Свой цвет', 'Custom color', '自定义颜色')"><i></i><input type="color" value="#ff7a2f"></label>
        </div>
        <div class="studio-name">
          <label class="sr-only" for="svc-name">{{ t("Имя сервиса", "Service name", "服务名称") }}</label>
          <input class="input" id="svc-name" type="text" maxlength="32" :placeholder="t('Имя сервиса', 'Service name', '服务名称')" value="ReClash" autocomplete="off">
        </div>
      </div>
      <div class="studio-body">
<pre class="http" :aria-label="t('Ответ подписки', 'Subscription response', '订阅响应')"><span class="line"><span class="k">HTTP/2 200</span></span><span class="line"><span class="k">subscription-userinfo:</span> <span class="v">upload=0; download=66571993088; total=214748364800</span></span><span class="line"><span class="k">profile-update-interval:</span> <span class="v">12</span></span><span class="line"><span class="rk">reclash-config:</span> <span class="v">https://example.com/reclash.yaml</span></span><span class="line"><span class="k"># reclash.yaml</span></span><span class="line" data-line="name"><span class="rk">provider.name:</span> <span class="v">ReClash</span></span><span class="line" data-line="hex"><span class="v">view.app.color: "#FF7A2F"</span></span><span class="line"><span class="rk">provider.announce.text:</span> <span class="v">{{ t("Профиль импортирован по ссылке.", "Profile imported from a link.", "配置已通过链接导入。") }}</span></span><span class="line"><span class="rk">provider.renew.url:</span> <span class="v">https://example.com/renew</span></span><span class="line"><span class="rk">cards:</span> <span class="v">[ banner, note, actions ]</span></span></pre>
        <div class="preview">
          <span class="preview-cap">{{ t("Карточка подписки в клиенте", "Subscription card in the client", "客户端中的订阅卡片") }}</span>
          <div class="subcard">
            <div class="sc-head">
              <span class="sc-logo" aria-hidden="true">R</span>
              <div style="min-width:0"><div class="sc-name">ReClash</div><div class="sc-sub">{{ t("Профиль из ссылки", "Profile from a link", "来自链接的配置") }}</div></div>
            </div>
            <div class="sc-ann"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3.2v4.1m0 2.4v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>{{ t("Профиль импортирован по ссылке.", "Profile imported from a link.", "配置已通过链接导入。") }}</div>
            <div class="sc-traffic">
              <div class="sc-row"><span>{{ t("Трафик", "Traffic", "流量") }}</span><b>{{ t("62 / 200 ГБ", "62 / 200 GB", "62 / 200 GB") }}</b></div>
              <div class="sc-bar"><i></i></div>
            </div>
            <div class="sc-btn">{{ t("Продлить", "Renew", "续费") }}</div>
          </div>
        </div>
      </div>
      <div class="studio-foot">
        <span>{{ t("Схема данных, не скриншот. Цвет задаётся в файле из reclash-config: view.app.color; точные оттенки считает приложение.", "A data illustration, not a screenshot. Set color in the reclash-config file with view.app.color; the app derives the exact shades.", "这是数据示意图，不是截图。颜色在 reclash-config 文件中通过 view.app.color 设置；具体色调由应用推算。") }}</span>
        <button class="linkbtn" type="button" data-reset>{{ t("Вернуть цвет ReClash", "Restore the ReClash color", "恢复 ReClash 颜色") }}</button>
      </div>
    </div>
  </div>
</section>

<!-- ============ PLATFORMS ============ -->
<section class="sec" id="platforms" aria-labelledby="plat-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="plat-title" data-words>{{ t("Работает на четырёх платформах.", "Runs on four platforms.", "支持四个平台。") }}</h2>
    </div>
    <ul class="plats" data-group data-items=".plat" data-cpull="0.03">
      <li class="plat" data-mg><h3>Windows</h3><ul><li>{{ t("Windows 10 и новее", "Windows 10 or later", "Windows 10 及更高版本") }}</li><li>{{ t("Установщик и портативная сборка", "Installer and portable build", "安装包和便携版") }}</li><li>{{ t("TUN и системный прокси", "TUN and system proxy", "TUN 和系统代理") }}</li></ul></li>
      <li class="plat" data-mg><h3>macOS</h3><ul><li>{{ t("macOS 12 и новее · Intel и Apple silicon", "macOS 12 or later · Intel and Apple silicon", "macOS 12 及更高版本 · Intel 和 Apple silicon") }}</li><li>{{ t("DMG-образ", "DMG image", "DMG 镜像") }}</li><li>{{ t("TUN через системного помощника", "TUN through a system helper", "通过系统助手使用 TUN") }}</li></ul></li>
      <li class="plat" data-mg><h3>Linux</h3><ul><li>{{ t("AppImage (x86_64), DEB, RPM и pacman", "AppImage (x86_64), DEB, RPM and pacman", "AppImage (x86_64)、DEB、RPM 和 pacman") }}</li><li>{{ t("Для ARM64 доступны DEB, RPM и pacman", "DEB, RPM and pacman packages are available for ARM64", "ARM64 提供 DEB、RPM 和 pacman 包") }}</li><li>{{ t("TUN и системный прокси", "TUN and system proxy", "TUN 和系统代理") }}</li></ul></li>
      <li class="plat" data-mg><h3>Android</h3><ul><li>{{ t("Android с поддержкой текущей сборки Flutter", "Android supported by the current Flutter build", "支持当前 Flutter 构建所支持的 Android 版本") }}</li><li>{{ t("APK по архитектурам", "APKs for each architecture", "按架构提供的 APK") }}</li><li>{{ t("Режим VPN-сервиса", "VPN service mode", "VPN 服务模式") }}</li></ul></li>
    </ul>
    <p class="plats-foot" data-fade>{{ t("Актуальные файлы всегда на", "Current files are always on the", "最新文件始终在") }} <SiteLink class="tlink" :to="pagePath(language, 'download')">{{ t("странице загрузок", "download page", "下载页面") }}</SiteLink>.</p>
  </div>
</section>

<!-- ============ HONEST ============ -->
<section class="sec" id="honest" aria-labelledby="honest-title">
  <div class="wrap honest">
    <div class="sec-head" style="margin:0">
      <h2 id="honest-title" data-words>{{ t("Уйти можно когда угодно.", "Leave whenever you want.", "想走随时可以走。") }}</h2>
      <p class="lede" data-fade>{{ t("Ни аккаунта, ни привязки. Серверы и профили ваши, а подписка в обычном формате Clash уносится в любой совместимый клиент. ReClash открыт целиком — ничто не держит вас здесь.", "No account or lock-in. Your servers and profiles belong to you, and a standard Clash subscription works with any compatible client. ReClash is fully open source: nothing keeps you here.", "没有账号，也没有绑定。服务器和配置都归你，标准 Clash 订阅可在任何兼容的客户端中使用。ReClash 完全开源，没有什么能把你留在这里。") }}</p>
    </div>
    <svg class="chain" viewBox="0 0 460 200" aria-hidden="true" data-reveal>
      <path class="lk lk-a" d="M60 65H140A35 35 0 0 1 140 135H60A35 35 0 0 1 60 65Z"/>
      <g class="free"><path class="lk lk-c" d="M300 65H380A35 35 0 0 1 380 135H300A35 35 0 0 1 300 65Z"/></g>
      <path class="lk lk-b" pathLength="100" style="stroke-dashoffset:56.5" d="M180 65H260A35 35 0 0 1 260 135H180A35 35 0 0 1 180 65Z"/>
    </svg>
  </div>
</section>

<!-- ============ WHAT IT IS ============ -->
<section class="sec" id="about" aria-labelledby="about-title">
  <div class="wrap lineage">
    <div class="lineage-copy">
      <h2 id="about-title" data-words>{{ t("Под капотом — FlClash и mihomo.", "Under the hood: FlClash and mihomo.", "底层是 FlClash 和 mihomo。") }}</h2>
      <p class="lede" data-fade>{{ t("ReClash развивает основу FlClash: добавляет маршрутизацию RCX, импорт подписок и отдельных узлов, метаданные провайдера и простую панель по умолчанию. Подробная панель включается в настройках оформления. На телефоне панель переключается между страницами свайпом; провайдер может задать вид кнопки включения. Интерфейс на Material You адаптируется к телефону и рабочему столу; соединения, DNS-запросы и логи доступны в инструментах.", "ReClash builds on FlClash with RCX routing, subscription and individual-node import, provider metadata and a simple dashboard by default. The detailed dashboard is enabled in Appearance settings. On phones, swipe between its pages; providers can set the power button's appearance. The Material You interface adapts to phones and desktops, with connections, DNS queries and logs available in Tools.", "ReClash 在 FlClash 的基础上开发，加入了 RCX 路由、订阅和单节点导入、服务商元数据，并默认使用简洁仪表盘。详细仪表盘可在外观设置中启用。在手机上可左右滑动切换页面；服务商可以设定电源按钮的外观。Material You 界面适配手机和桌面，连接、DNS 查询和日志可在工具中查看。") }}</p>
      <p class="lineage-note" data-fade style="--d:120ms">{{ t("Проект не аффилирован с FlClash, mihomo или FlClashX.", "The project is not affiliated with FlClash, mihomo or FlClashX.", "本项目与 FlClash、mihomo 或 FlClashX 没有关联。") }} <SiteLink class="tlink" :to="pagePath(language, 'start') + '#faq-flclash'">{{ t("Чем отличается от FlClash", "How it differs from FlClash", "与 FlClash 有何不同") }}</SiteLink></p>
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
        <li data-mg data-layer="2" tabindex="0"><span class="mg-c"><b>ReClash</b><span class="s">{{ t("Маршрутизация RCX, подписки, панель и инструменты", "RCX routing, subscriptions, dashboard and tools", "RCX 路由、订阅、仪表盘和工具") }}</span></span></li>
        <li data-mg data-layer="1" tabindex="0"><span class="mg-c"><b>FlClash</b><span class="s">{{ t("Кроссплатформенная основа на Flutter", "A cross-platform foundation built with Flutter", "基于 Flutter 的跨平台底层") }}</span></span></li>
        <li data-mg data-layer="0" tabindex="0"><span class="mg-c"><b>mihomo</b><span class="s">{{ t("Ядро маршрутизации: правила, группы, GeoIP, fake-ip", "Routing core: rules, groups, GeoIP, fake-ip", "路由内核：规则、分组、GeoIP、fake-ip") }}</span></span></li>
      </ul>
    </div>
  </div>
</section>

<!-- ============ NEXT ============ -->
<section class="sec" id="next" aria-labelledby="next-title">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="next-title" data-words>{{ t("Дальше — смотря кто вы.", "What comes next depends on you.", "接下来做什么，取决于你是谁。") }}</h2>
    </div>
    <div class="next" data-group data-items=".path" data-cpull="0.025">
      <SiteLink class="path" data-mg :to="pagePath(language, 'download')">
        <svg class="blob" viewBox="0 0 150 150" aria-hidden="true"><path/></svg>
        <span class="mg-c" style="display:grid;gap:16px">
          <span class="who">{{ t("У вас есть ссылка", "You have a link", "你有一条链接") }}</span>
          <h3>{{ t("Вставьте ссылку и подключитесь", "Paste your link and connect", "粘贴链接并连接") }}</h3>
          <p>{{ t("ReClash откроет ссылку провайдера, покажет остаток трафика и подключит — без аккаунта, регистрации и почты.", "ReClash opens your provider's link, shows remaining traffic and connects, without an account, registration or email.", "ReClash 会打开服务商的链接，显示剩余流量并完成连接，无需账号、注册或邮箱。") }}</p>
        </span>
        <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Скачать ReClash", "Download ReClash", "下载 ReClash") }}</span>
      </SiteLink>
      <SiteLink class="path" data-mg :to="pagePath(language, 'builder')">
        <svg class="blob" viewBox="0 0 150 150" aria-hidden="true"><path/></svg>
        <span class="mg-c" style="display:grid;gap:16px">
          <span class="who">{{ t("Вы продаёте доступ", "You sell access", "你在销售访问服务") }}</span>
          <h3>{{ t("Сделайте клиент своим", "Make the client your own", "让客户端成为你自己的") }}</h3>
          <p>{{ t("Один манифест по ссылке из заголовка reclash-config — и приложение носит ваш логотип, цвет, объявления и кнопку продления. Своего приложения не нужно.", "One manifest linked from the reclash-config header brings your logo, color, announcements and renewal button to the app. No need to build your own client.", "reclash-config 头中链接的一份清单，就能把你的标志、颜色、公告和续费按钮带进应用。无需自己开发客户端。") }}</p>
        </span>
        <span class="go"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ t("Собрать манифест", "Build the manifest", "生成清单") }}</span>
      </SiteLink>
    </div>
  </div>
</section>
</div>
</template>
