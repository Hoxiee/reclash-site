"""Downloads. Honest about the fact that there is no published release yet."""

from . import ui
from .ui import esc, icon, brand_icon, mark, rubric, chip, btn, codeblock, notice, table, json_block


# Platform, brand icon, ru/en package summary, ru/en note.
PLATFORMS = [
    ("windows", "windows", "Windows", "Windows",
     ("Установщик или портативный ZIP", "Installer or portable ZIP"),
     ["x64", "ARM64"],
     ("Windows 10 и новее. Портативная сборка не требует прав администратора, "
      "но режим TUN — требует.",
      "Windows 10 and later. The portable build needs no administrator rights, "
      "but TUN mode does.")),
    ("macos", "apple", "macOS", "macOS",
     ("DMG", "DMG"),
     ("Apple silicon", "Intel"),
     ("Сборка не подписана в App Store: при первом запуске откройте её через "
      "контекстное меню → «Открыть».",
      "The build is not App Store signed: on first launch open it from the "
      "context menu → “Open”.")),
    ("linux", "linux", "Linux", "Linux",
     ("AppImage (x64), DEB, RPM", "AppImage (x64), DEB, RPM"),
     ["x64", "ARM64"],
     ("AppImage запускается без установки — не забудьте <code>chmod +x</code>. "
      "DEB и RPM ставят службу TUN сами.",
      "The AppImage runs without installing — remember <code>chmod +x</code>. "
      "DEB and RPM set up the TUN helper themselves.")),
    ("android", "android", "Android", "Android",
     ("APK", "APK"),
     ["arm64-v8a", "armeabi-v7a", "x86_64"],
     ("Для большинства телефонов — <code>arm64-v8a</code>. Есть плитка в "
      "шторке, виджеты и Always-on VPN.",
      "For most phones — <code>arm64-v8a</code>. Ships a Quick Settings tile, "
      "home-screen widgets and Always-on VPN.")),
]

ICON_TEMPLATES = ("windows", "macos", "linux", "android", "ios")


def dl_strings(ctx):
    t = ctx.t
    return {
        "os_windows": "Windows",
        "os_macos": "macOS",
        "os_linux": "Linux",
        "os_android": "Android",
        "os_ios": "iOS",
        "os_other": t("Прочее", "Other"),
        "files": t("файлов", "files"),
        "onGithub": t("Смотреть на GitHub", "View on GitHub"),
        # SHA256 verifier. The file never leaves the browser; the hash is
        # computed locally with the Web Crypto API and compared against a
        # value the visitor pastes from the release.
        "v_drop": t("Перетащите файл сюда или выберите",
                    "Drop a file here or choose one"),
        "v_local": t("Файл никуда не загружается — хеш считается прямо в браузере.",
                     "The file is not uploaded anywhere — the hash is computed right in your browser."),
        "v_computing": t("Считаю SHA256…", "Computing SHA256…"),
        "v_hash_cap": t("SHA256 файла", "File SHA256"),
        "v_expect_cap": t("Ожидаемый хеш или содержимое SHA256SUMS",
                          "Expected hash or SHA256SUMS contents"),
        "v_expect_ph": t("Вставьте хеш из релиза или весь SHA256SUMS…",
                         "Paste the hash from the release, or the whole SHA256SUMS…"),
        "v_hint": t("Выберите файл, чтобы посчитать его хеш.",
                    "Choose a file to compute its hash."),
        "v_needfile": t("Сначала выберите файл — его хеш сравним с этим.",
                        "Choose a file first — its hash will be compared to this."),
        "v_needexp": t("Вставьте ожидаемый хеш, чтобы сравнить.",
                       "Paste the expected hash to compare."),
        "v_match": t("Совпадает — файл тот самый.",
                     "Match — this is the right file."),
        "v_mismatch": t("Не совпадает. Не запускайте этот файл.",
                        "No match. Do not run this file."),
        "v_notfound": t("В SHA256SUMS нет строки для этого файла.",
                        "No line for this file in the SHA256SUMS."),
        "v_unsupported": t("Этот браузер не умеет считать хеш здесь. Проверьте в терминале — команды ниже.",
                           "This browser cannot hash here. Verify in a terminal — the commands are below."),
        "v_error": t("Не удалось прочитать файл. Попробуйте ещё раз.",
                     "Could not read the file. Try again."),
        "v_copy": t("копировать", "copy"),
        "v_copied": t("готово", "copied"),
        "v_cli": t("…или проверьте в терминале", "…or verify in a terminal"),
    }


def templates():
    """Hidden <template> icons that downloads.js clones into rendered rows."""
    out = []
    for name in ICON_TEMPLATES:
        key = {"macos": "apple", "ios": "apple"}.get(name, name)
        out.append('<template id="icon-%s">%s</template>' % (name, brand_icon(key)))
    return "".join(out)


# ------------------------------------------------------------------ sections


def section_hero(ctx):
    t = ctx.t
    return (
        '<section class="pagehead"><div class="shell">'
        '<p class="eyebrow">' + esc(t("Загрузки", "Downloads")) + "</p>"
        "<h1>"
        + t('Соберите или <span class="grad">скачайте</span>',
            'Build it or <span class="grad">download it</span>')
        + "</h1>"
        '<p class="lede">' + esc(t(
            "Ниже — живой список файлов последнего релиза, прямо из GitHub. "
            "Если релиза ещё нет, страница так и скажет, а не подсунет мёртвую ссылку.",
            "Below is a live file list of the latest release, straight from GitHub. "
            "If there is no release yet the page says so instead of handing you a dead link.",
        )) + "</p>"
        '<p class="pagehead__meta">'
        + chip("GPL-3.0")
        + chip(t("4 платформы", "4 platforms")) + chip("SHA256")
        + "</p></div></section>"
    )


def section_live(ctx):
    t = ctx.t
    return (
        '<section class="section section--tight" id="downloads" data-repo="' + ui.REPO + '">'
        '<div class="shell">'
        + rubric("01", t("последний релиз", "latest release"))
        + '<div class="dl-hero">'
        '<div class="dl-primary">'
        '<p class="eyebrow">' + esc(t("Ваша платформа", "Your platform")) + "</p>"
        '<p class="dl-primary__os"><span data-os-icon></span>'
        '<span data-os-name>' + esc(t("Определяем…", "Detecting…")) + "</span>"
        '<span class="mono faint" data-arch style="font-size:.75rem"></span></p>'
        '<p class="dl-note">' + esc(t(
            "Определяется по браузеру и может ошибаться — полный список файлов "
            "всегда ниже.",
            "Guessed from your browser and can be wrong — the full file list is "
            "always below.",
        )) + "</p>"
        '<p class="row gap-2" style="margin-top:var(--step-3);flex-wrap:wrap">'
        + btn(ui.GITHUB_RELEASES, t("Все релизы", "All releases"), "btn--sm", "download", True)
        + btn(ui.GITHUB, "GitHub", "btn--sm btn--ghost", "link", True)
        + "</p></div>"
        '<div>'
        '<div class="dl-state" id="dl-loading">'
        '<span class="dl-spin" aria-hidden="true"></span>'
        + esc(t("Спрашиваем GitHub…", "Asking GitHub…")) + "</div>"
        '<div class="dl-state" id="dl-empty" hidden>'
        "<strong>" + esc(t("Публичных релизов пока нет.",
                           "There are no public releases yet.")) + "</strong>"
        '<p class="dl-note">' + esc(t(
            "Проект ещё не выпустил собранные пакеты. Соберите из исходников — "
            "инструкция ниже — или следите за релизами на GitHub.",
            "The project has not published built packages yet. Build from source — "
            "the recipe is below — or watch releases on GitHub.",
        )) + "</p></div>"
        '<div class="dl-state" id="dl-failed" hidden>'
        "<strong>" + esc(t("GitHub не ответил.", "GitHub did not answer.")) + "</strong>"
        '<p class="dl-note">' + esc(t(
            "Возможно, сработал лимит API или блокировка. Откройте страницу "
            "релизов напрямую.",
            "Possibly an API rate limit or a block. Open the releases page directly.",
        )) + "</p>"
        '<p style="margin-top:var(--step-2)">'
        + btn(ui.GITHUB_RELEASES, t("Открыть релизы", "Open releases"),
              "btn--sm btn--ghost", "link", True)
        + "</p></div>"
        '<div class="dl-list" id="dl-assets"></div>'
        "</div></div>"
        '<div class="release" id="dl-release" hidden style="margin-top:var(--step-4)"></div>'
        "</div>"
        + json_block("dl-strings", dl_strings(ctx))
        + templates()
        + "</section>"
    )


def section_platforms(ctx):
    t = ctx.t
    L = 0 if ctx.lang == "ru" else 1
    cards = ""
    for key, ico, ru, en, pkg, arches, note in PLATFORMS:
        arch_chips = "".join('<li>%s</li>' % esc(a) for a in arches)
        cards += (
            '<article class="platform" data-glow data-platform="' + key + '">'
            '<span class="platform__icon">' + brand_icon(ico) + "</span>"
            '<h3 class="platform__os">' + esc(ru if L == 0 else en) + "</h3>"
            '<p class="mono faint" style="font-size:.72rem;letter-spacing:.08em">'
            + esc(pkg[L]) + "</p>"
            "<ul>" + arch_chips + "</ul>"
            '<p style="font-size:.88rem;color:var(--text-dim);margin-top:var(--step-2)">'
            + note[L] + "</p>"
            "</article>"
        )
    return (
        '<section class="section"><div class="shell">'
        + rubric("02", t("что под какой системой", "what runs where"))
        + '<h2 class="statement">'
        + t("Четыре платформы, <em>одна</em> сборка правил.",
            "Four platforms, <em>one</em> set of rules.")
        + "</h2>"
        '<div class="platforms" style="margin-top:var(--step-4)">' + cards + "</div>"
        + '<p class="dl-note" style="margin-top:var(--step-3)">' + esc(t(
            "iOS-сборки нет: App Store не пускает клиенты такого рода без отдельной "
            "программы разработчика. Заявлять её на сайте было бы враньём.",
            "There is no iOS build: the App Store does not admit clients of this kind "
            "without a separate developer programme. Claiming one here would be a lie.",
        )) + "</p>"
        "</div></section>"
    )


def verify_tool(ctx):
    """A live SHA256 checker. The file is read and hashed in the browser with
    the Web Crypto API — nothing is uploaded — and compared against a hash the
    visitor pastes from the release (a single digest or a whole SHA256SUMS)."""
    t = ctx.t
    return (
        '<div class="verify" data-verify>'
        # left: pick/drop a file, see its hash
        '<div class="verify__file">'
        '<label class="verify__drop" data-drop tabindex="0" role="button">'
        + icon("shield", "verify__drop__ico")
        + '<span class="verify__drop__cap" data-drop-cap>'
        + esc(t("Перетащите файл сюда или выберите",
                "Drop a file here or choose one")) + "</span>"
        '<input type="file" class="visually-hidden" data-file>'
        "</label>"
        '<p class="verify__local">' + icon("lock", "verify__local__ico")
        + "<span>" + esc(t(
            "Файл никуда не загружается — хеш считается прямо в браузере.",
            "The file is not uploaded anywhere — the hash is computed right in your browser.",
        )) + "</span></p>"
        '<div class="verify__hash codeblock" data-hash-box hidden>'
        '<span class="verify__cap">' + esc(t("SHA256 файла", "File SHA256")) + "</span>"
        '<button class="copy" type="button" data-copy="[data-hash]" '
        'data-done-label="%s">%s</button>' % (
            esc(t("готово", "copied")), esc(t("копировать", "copy")))
        + '<code class="verify__out" data-hash></code>'
        "</div>"
        "</div>"
        # right: paste the expected value, get a verdict
        '<div class="verify__expect">'
        '<span class="verify__cap">'
        + esc(t("Ожидаемый хеш или содержимое SHA256SUMS",
                "Expected hash or SHA256SUMS contents")) + "</span>"
        '<textarea class="verify__ta" data-expect spellcheck="false" '
        'autocomplete="off" rows="3" aria-label="%s" placeholder="%s"></textarea>' % (
            esc(t("Ожидаемый хеш", "Expected hash")),
            esc(t("Вставьте хеш из релиза или весь SHA256SUMS…",
                  "Paste the hash from the release, or the whole SHA256SUMS…")))
        + '<p class="verify__verdict" data-verdict data-tone="idle" role="status">'
        + esc(t("Выберите файл, чтобы посчитать его хеш.",
                "Choose a file to compute its hash.")) + "</p>"
        "</div>"
        "</div>"
    )


def section_verify(ctx):
    t = ctx.t
    return (
        '<section class="section section--tight" id="verify"><div class="shell">'
        + rubric("03", t("проверка", "verification"))
        + '<div class="split">'
        + "<div><h2 class=\"statement\">"
        + t("Скачали — <em>проверьте</em>.", "Downloaded it? <em>Check</em> it.")
        + "</h2></div>"
        + '<div><p class="lede">' + esc(t(
            "В каждом релизе лежит SHA256SUMS. Тридцать секунд на проверку стоят "
            "того: подменённый VPN-клиент — это худшее, что может случиться с "
            "вашим трафиком.",
            "Every release ships a SHA256SUMS file. Thirty seconds of checking is "
            "worth it: a tampered VPN client is the worst thing that can happen to "
            "your traffic.",
        )) + "</p></div></div>"
        + '<div style="margin-top:var(--step-4)">' + verify_tool(ctx) + "</div>"
        + notice("<span>" + t(
            "Совпал хеш — файл тот самый. Не совпал — не запускайте и "
            "напишите в <a class=\"link link--cyan\" href=\"%s\" target=\"_blank\" "
            "rel=\"noopener\">issues</a>." % ui.GITHUB_ISSUES,
            "If the hash matches, the file is the right one. If it does not — do not "
            "run it, and report it in <a class=\"link link--cyan\" href=\"%s\" "
            "target=\"_blank\" rel=\"noopener\">issues</a>." % ui.GITHUB_ISSUES,
        ) + "</span>", "notice--info")
        # The terminal route stays for those who prefer it, folded away so the
        # live tool is the first thing offered.
        + '<details class="verify__cli">'
        + '<summary>' + esc(t("…или проверьте в терминале",
                              "…or verify in a terminal")) + "</summary>"
        + '<div class="doc__cols" style="margin-top:var(--step-3)">'
        + "<div><h3>Linux / macOS</h3>"
        + codeblock("sha256sum -c SHA256SUMS --ignore-missing",
                    t("копировать", "copy"), t("готово", "copied"))
        + "</div>"
        + "<div><h3>Windows (PowerShell)</h3>"
        + codeblock("Get-FileHash .\\ReClash-setup.exe -Algorithm SHA256",
                    t("копировать", "copy"), t("готово", "copied"))
        + "</div></div></details>"
        + "</div></section>"
    )


def section_source(ctx):
    t = ctx.t
    build_sh = (
        "git clone https://github.com/Hoxiee/ReClash.git\n"
        "cd ReClash\n"
        "flutter pub get\n"
        "dart run setup.dart            # " + t("хост-платформа", "host platform") + "\n"
        "dart run setup.dart android    # " + t("APK", "APK") + "\n"
        "# → dist/"
    )
    reqs = t(
        [
            "Flutter (канал stable) и Go — ядро mihomo собирается из исходников.",
            "Windows: GCC и Inno Setup для установщика.",
            "macOS: Node.js для <code>appdmg</code>.",
            "Linux: пакетчик попросит права администратора, чтобы доставить нативные зависимости.",
        ],
        [
            "Flutter (stable channel) and Go — the mihomo core is built from source.",
            "Windows: GCC and Inno Setup for the installer.",
            "macOS: Node.js for <code>appdmg</code>.",
            "Linux: the packager asks for administrator rights to pull native dependencies.",
        ],
    )
    return (
        '<section class="section"><div class="shell">'
        + rubric("04", t("из исходников", "from source"))
        + '<div class="split">'
        + '<div><h2 class="statement">'
        + t("Не ждать релиза — <em>собрать</em> самому.",
            "Do not wait for a release — <em>build</em> it.")
        + "</h2>"
        + '<p class="lede" style="margin-top:var(--step-3)">' + esc(t(
            "Это самый честный способ доверять клиенту: вы видите, что собираете.",
            "This is the most honest way to trust a client: you can see what you are building.",
        )) + "</p>"
        + "<ul style=\"margin-top:var(--step-3)\">"
        + "".join("<li>" + x + "</li>" for x in reqs)
        + "</ul></div>"
        + "<div>"
        + codeblock(build_sh, t("копировать", "copy"), t("готово", "copied"))
        + '<p class="dl-note">' + t(
            'Подробности — в <a class="link link--cyan" href="%s/blob/main/CONTRIBUTING.md" '
            'target="_blank" rel="noopener">CONTRIBUTING.md</a>.' % ui.GITHUB,
            'Details are in <a class="link link--cyan" href="%s/blob/main/CONTRIBUTING.md" '
            'target="_blank" rel="noopener">CONTRIBUTING.md</a>.' % ui.GITHUB,
        ) + "</p></div></div>"
        + "</div></section>"
    )


def section_after(ctx):
    t = ctx.t
    return (
        '<section class="section section--tight"><div class="shell">'
        + rubric("05", t("дальше", "next"))
        + '<div class="row gap-2" style="flex-wrap:wrap;margin-top:var(--step-3)">'
        + btn(ctx.page("start"), t("Быстрый старт и FAQ", "Quick start & FAQ"),
              "btn--lg", "bolt")
        + btn(ctx.page("docs"), t("Заголовки для провайдеров", "Provider headers"),
              "btn--lg btn--ghost", "book")
        + "</div></div></section>"
    )


def render(ctx):
    t = ctx.t
    body = "".join([
        section_hero(ctx),
        section_live(ctx),
        section_platforms(ctx),
        section_verify(ctx),
        section_source(ctx),
        section_after(ctx),
    ])
    return {
        "active": "download",
        "title": t("Загрузки", "Downloads"),
        "description": t(
            "Сборки ReClash для Windows, macOS, Linux и Android: живой список файлов "
            "последнего релиза, проверка SHA256 и сборка из исходников.",
            "ReClash builds for Windows, macOS, Linux and Android: a live file list of "
            "the latest release, SHA256 verification and building from source.",
        ),
        "body": body,
        "css": ("docs.css",),
        "js": ("downloads.js",),
    }
