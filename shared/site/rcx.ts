import { rich, type DocSection } from './docs'
import type { Language } from './routes'

const profileExample = [
  'rcx: 1',
  'title: Germany first',
  'prefer:',
  '  - label: Germany',
  '    when: country = DE',
  '  - label: Any working server',
  '    when: not dead',
  'rank:',
  '  by: latency',
].join('\n')

const scenarioExample = [
  'rcx: 1',
  'title: Chat via a selected group',
  'mode: rule',
  'groups:',
  '  $main: { profile: builtin/fastest }',
  'routes:',
  '  - name: Telegram',
  '    match: [GEOSITE,telegram]',
  '    prefer:',
  '      - label: Any working server',
  '        when: not dead',
].join('\n')

export function rcxSections(language: Language): DocSection[] {
  const t = (ru: string, en: string) => language === 'ru' ? ru : en
  const p = (ru: string, en: string) => ({ kind: 'p' as const, text: rich(t(ru, en)) })
  const note = (tone: 'info' | 'warn', ru: string, en: string) => ({ kind: 'note' as const, tone, text: rich(t(ru, en)) })
  const sourceLink = (path: string) => `https://github.com/Hoxiee/ReClash/blob/dev/docs/auto-routing/${path}`

  return [
    {
      id: 'overview',
      title: t('Что такое RCX', 'What RCX is'),
      keys: 'автомаршрутизация профиль сценарий группа выбор сервера',
      blocks: [
        p(
          'RCX — система автоматической маршрутизации ReClash. Профиль задаёт, какие серверы подходят группе, в каком порядке их рассматривать и как ранжировать. Сценарий связывает правила нескольких групп, режим подключения, поведение для разных сетей и маршруты трафика.',
          'RCX is ReClash’s automatic routing system. A profile defines which servers fit a group, the order to consider them in and how to rank them. A scenario coordinates rules for multiple groups, connection mode, network-specific behavior and traffic routes.'),
        p(
          'Решение строится по политике и измеренным данным, а приложение показывает ранжирование и причину выбора. Можно оставить группу под управлением RCX, закрепить сервер или выбрать его вручную.',
          'Decisions use the policy and measured evidence; the app shows the ranking and why a server was selected. You can leave a group under RCX control, pin a server or choose one manually.'),
        note('info',
          'Профили не подменяют конфигурацию mihomo: движок использует группу, подключённую к RCX. mihomo игнорирует ключ `rcx`, поэтому профиль конфигурации остаётся допустимым и в других клиентах. Без этого ключа группа продолжает работать по настройкам подписки.',
          'Profiles do not replace the mihomo configuration: the engine uses a group connected to RCX. mihomo ignores the `rcx` key, so the configuration remains valid in other clients. Without that key, the group continues to use the subscription’s normal settings.'),
        { kind: 'steps', items: [
          rich(t('Профиль задаёт поведение одной группы.', 'A profile defines the behavior of one group.')),
          rich(t('Сценарий связывает группы и маршруты в общий план подключения.', 'A scenario coordinates groups and routes into one connection plan.')),
          rich(t('Движок оценивает доказательства, учитывает ограничения проверок и объясняет результат.', 'The engine evaluates evidence, respects probe limits and explains the result.')),
        ] },
      ],
    },
    {
      id: 'profiles',
      title: t('Профили и порядок серверов', 'Profiles and server order'),
      keys: 'профиль лестница предпочитаемые шаги pool prefer rank switch',
      blocks: [
        p(
          'Профиль — YAML-политика для одной умной группы. `prefer` задаёт шаги сверху вниз: движок использует первый шаг, в котором есть работающий сервер. `rank` выбирает лучший сервер внутри этого шага; например, `latency` ранжирует по задержке, а `stability` сильнее учитывает разброс и прошлые сбои.',
          'A profile is a YAML policy for one smart group. `prefer` lists steps from top to bottom: the engine uses the first step with a working server. `rank` picks the best server within that step; `latency` ranks by delay, while `stability` weighs spread and past failures more heavily.'),
        { kind: 'code', code: profileExample, label: t('Пример профиля', 'Profile example') },
        p(
          'Условия используют данные узла: страну, тип, имя, задержку, состояние и результаты проверок. Неизмеренный факт остаётся неизвестным, а не считается ложным: сервер может отображаться как ожидающий проверки. Pool ограничивает допустимые узлы; дочерний профиль может только сузить родительский пул.',
          'Conditions use node data such as country, type, name, latency, health and check results. An unmeasured fact remains unknown instead of being treated as false, so a server can be shown as pending a check. A pool limits eligible nodes; a child profile can only narrow its parent’s pool.'),
        p(
          'Условия поддерживают `and`, `or`, `not`, сравнения, списки, регулярные выражения RE2, `tag(name)`, `passes(id)` и `fails(id)`. Для внешних документов требуется `rcx: 1`; неизвестные поля отклоняются валидатором.',
          'Conditions support `and`, `or`, `not`, comparisons, lists, RE2 regular expressions, `tag(name)`, `passes(id)` and `fails(id)`. External documents require `rcx: 1`; the validator rejects unknown fields.'),
        note('info',
          'Переход с работающего сервера регулирует `switch`: улучшение можно включить отдельно, а пауза, минимальный выигрыш, подтверждающие измерения и лимит переключений помогают избежать дрожания.',
          'The `switch` policy governs when to leave a working server: improvement can be enabled explicitly, while dwell time, minimum gain, confirming samples and a switch cap help avoid flapping.'),
      ],
    },
    {
      id: 'scenarios',
      title: t('Сценарии и маршруты', 'Scenarios and routes'),
      keys: 'сценарий routes маршрут группы режим rule global direct сеть',
      blocks: [
        p(
          'Сценарий управляет подключением целиком. Он может задать режим `rule`, `global` или `direct`, назначить профили группам и переопределить поведение для распознанного типа сети. Если сценарий не задаёт группу, она сохраняет собственное поведение.',
          'A scenario controls the connection as a whole. It can set `rule`, `global` or `direct` mode, assign profiles to groups and override behavior for a detected network kind. Groups not named by the scenario keep their own behavior.'),
        { kind: 'code', code: scenarioExample, label: t('Сценарий с маршрутом', 'Scenario with a route') },
        p(
          'Маршруты проверяются по порядку и действуют только в режиме `rule`. Совпавший маршрут может отправить трафик в собственную группу с серверным порядком или в фиксированную цель, например `DIRECT`. Маршрут без `to` создаёт группу; если подходит несколько маршрутов, срабатывает первый, а трафик без совпадения остаётся в основной группе подписки.',
          'Routes are checked in order and apply only in `rule` mode. A matching route can send traffic through its own group and server order, or to a fixed target such as `DIRECT`. A route without `to` creates a group; when several routes match, the first wins, and unmatched traffic stays in the subscription’s main group.'),
        { kind: 'table', direction: t('Кто задаёт выбор', 'Who controls the choice'), head: [t('Уровень', 'Layer'), t('Роль', 'Role')], rows: [
          [rich(t('Профиль', 'Profile')), rich(t('Базовое поведение группы.', 'The group’s baseline behavior.'))],
          [rich(t('Пользователь', 'User')), rich(t('Может закрепить сервер, выбрать вручную или переопределить порядок.', 'Can pin a server, choose manually or override the server order.'))],
          [rich(t('Сценарий', 'Scenario')), rich(t('Может задать для управляемой группы собственный профиль, пул или порядок.', 'Can set a profile, pool or order for a group it controls.'))],
        ] },
        p(
          'Для порядка серверов действует приоритет: порядок сценария → выбор пользователя → порядок профиля. Выбранный вручную режим подключения также перестаёт подчиняться сценарию, пока пользователь не вернёт Auto.',
          'Server-order precedence is scenario → user choice → profile. A connection mode chosen manually also stops following the scenario until the user returns it to Auto.'),
        note('warn',
          'Маршруты не являются TUN/VPN-переключателем. TUN или системный прокси отвечают за перехват трафика; режим mihomo и маршруты RCX определяют дальнейшее направление.',
          'Routes are not a TUN/VPN switch. TUN or the system proxy captures traffic; mihomo mode and RCX routes determine where it goes next.'),
      ],
    },
    {
      id: 'evidence',
      title: t('Проверки, бюджет и контроль', 'Checks, budgets and control'),
      keys: 'доказательства проверка энергия бюджет escrow ошибки авто вручную закрепить consent согласие',
      blocks: [
        p(
          'Проверки доступны только когда могут повлиять на решение и расходуют ограниченный бюджет. Класс профиля и уровень `energy` задают разрешённый объём. Задержка, её разброс, сбои и результаты именованных HTTP/TCP/TLS-проверок дают движку факты для ранжирования.',
          'Checks run only when they can affect a decision and consume a limited budget. Profile level and `energy` set the allowance. Latency, spread, failures and named HTTP/TCP/TLS checks provide evidence for ranking.'),
        p(
          'Если связь целиком пропала, отдельный сбой не доказывает, что сервер плохой: подтверждения удерживаются, пока канал не восстановится. Это не даёт ошибочно исключить все узлы из-за локального отключения сети.',
          'When connectivity is lost entirely, one failed probe does not prove a server is bad: failures are held until the link is proven again. This prevents a local outage from wrongly condemning every node.'),
        { kind: 'table', direction: t('Режим управления группой', 'Group control modes'), head: [t('Режим', 'Mode'), t('Что происходит', 'What it means')], rows: [
          [rich('Auto'), rich(t('RCX выбирает сервер по действующим правилам.', 'RCX selects a server using the active policy.'))],
          [rich('Pinned'), rich(t('Текущий сервер закреплён; автоматический выбор не перемещает его.', 'The current server is pinned; automatic selection does not move it.'))],
          [rich('Manual'), rich(t('Пользователь сам выбрал сервер.', 'The user chose the server directly.'))],
        ] },
        note('warn',
          'Профили провайдера могут описывать проверки к внешним хостам. ReClash показывает их и запрашивает согласие до обращения; пользователь решает, разрешать ли их.',
          'Provider profiles can define checks against external hosts. ReClash shows them and asks for consent before making those requests; the user decides whether to allow them.'),
      ],
    },
    {
      id: 'sharing',
      title: t('Импорт, обмен и проверка', 'Import, sharing and validation'),
      keys: 'экспорт импорт bundle пакет ссылка reclash://routing rcxlint lint yaml схема',
      blocks: [
        p(
          'Профили и сценарии можно экспортировать отдельно или вместе в bundle, который включает необходимые пользовательские профили. При импорте имена подбираются без перезаписи существующих профилей; ссылки между элементами обновляются. Ограничение размера профиля и сценария — 64 КиБ, bundle — 256 КиБ.',
          'Profiles and scenarios can be exported separately or together in a bundle containing the user profiles they need. On import, names are chosen without replacing existing profiles, and references between bundle items are updated. Profiles and scenarios are limited to 64 KiB; bundles to 256 KiB.'),
        { kind: 'code', code: 'reclash://routing?p=<compressed-base64url>\nreclash://routing?url=<https-url>', label: t('Ссылки RCX', 'RCX links') },
        p(
          'В `p` передаётся YAML в UTF-8, сжатый raw deflate и закодированный base64url без padding; распакованный текст ограничен 64 КиБ. Вариант `url` принимает только HTTPS-файл размером до 64 КиБ. Ссылка открывает экран проверки импорта: документ не сохраняется автоматически.',
          'The `p` parameter carries UTF-8 YAML compressed with raw deflate and encoded as unpadded base64url; the inflated text is limited to 64 KiB. The `url` form accepts only an HTTPS file up to 64 KiB. A link opens the import review; the document is not saved automatically.'),
        { kind: 'code', code: 'dart run tool/rcx.dart lint <file.yaml>', label: t('Проверить документ из корня репозитория', 'Validate a document from the repository root') },
        p(
          'Валидатор `rcxlint` использует тот же разбор и ограничения, что импорт приложения. Полный формат профилей описан в [справочнике](https://github.com/Hoxiee/ReClash/blob/dev/docs/auto-routing/profiles.md), сценариев — в [документации сценариев](https://github.com/Hoxiee/ReClash/blob/dev/docs/auto-routing/scenarios.md), а обмена — в [руководстве по sharing](https://github.com/Hoxiee/ReClash/blob/dev/docs/auto-routing/sharing.md).',
          'The `rcxlint` validator uses the same parser and limits as app import. See the [profile reference](https://github.com/Hoxiee/ReClash/blob/dev/docs/auto-routing/profiles.md), [scenario guide](https://github.com/Hoxiee/ReClash/blob/dev/docs/auto-routing/scenarios.md) and [sharing guide](https://github.com/Hoxiee/ReClash/blob/dev/docs/auto-routing/sharing.md) for the full formats.'),
        note('info',
          'Начать работу в приложении можно из «Расширенная конфигурация» → «Автомаршрутизация». Там доступны обзор, сценарии, маршруты, группы и библиотека профилей.',
          'Open Advanced configuration → Auto routing in the app to get started. The hub provides the overview, scenarios, routes, groups and profile library.'),
      ],
    },
    {
      id: 'source-docs',
      title: t('Полная документация', 'Full documentation'),
      keys: 'исходники engine cookbook редактор troubleshooting движок рецепты',
      blocks: [
        p(
          'Эта страница — вводная. Подробные спецификации, рецепты и руководство по экранам редактора поддерживаются вместе с кодом ReClash и доступны в репозитории.',
          'This page is an introduction. Detailed specifications, recipes and editor-screen guides are maintained with the ReClash source.'),
        { kind: 'steps', items: [
          rich(`[README RCX](${sourceLink('README.md')})`),
          rich(`[Движок и объяснения решений](${sourceLink('engine.md')}) / [Engine and decisions](${sourceLink('engine.md')})`),
          rich(`[Условия](${sourceLink('conditions.md')}) / [Conditions](${sourceLink('conditions.md')})`),
          rich(`[Редактор в приложении](${sourceLink('editor/README.md')}) / [In-app editor](${sourceLink('editor/README.md')})`),
          rich(`[Практические рецепты](${sourceLink('cookbook.md')}) / [Cookbook](${sourceLink('cookbook.md')})`),
        ] },
      ],
    },
  ]
}
