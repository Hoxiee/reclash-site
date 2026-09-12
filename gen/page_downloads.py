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
     ("AppImage, DEB, RPM", "AppImage, DEB, RPM"),
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
        + chip("GPL-3.0") + chip(t("Без телеметрии", "No telemetry"))
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
            '<article class="platform" data-platform="' + key + '">'
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


def section_verify(ctx):
    t = ctx.t
    return (
        '<section class="section section--tight"><div class="shell">'
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
        + '<div class="doc__cols" style="margin-top:var(--step-4)">'
        + "<div><h3>Linux / macOS</h3>"
        + codeblock("sha256sum -c SHA256SUMS --ignore-missing",
                    t("копировать", "copy"), t("готово", "copied"))
        + "</div>"
        + "<div><h3>Windows (PowerShell)</h3>"
        + codeblock("Get-FileHash .\\ReClash-setup.exe -Algorithm SHA256",
                    t("копировать", "copy"), t("готово", "copied"))
        + "</div></div>"
        + notice("<span>" + t(
            "Совпала строка — файл тот самый. Не совпала — не запускайте и "
            "напишите в <a class=\"link link--cyan\" href=\"%s\" target=\"_blank\" "
            "rel=\"noopener\">issues</a>." % ui.GITHUB_ISSUES,
            "If the line matches, the file is the right one. If it does not — do not "
            "run it, and report it in <a class=\"link link--cyan\" href=\"%s\" "
            "target=\"_blank\" rel=\"noopener\">issues</a>." % ui.GITHUB_ISSUES,
        ) + "</span>", "notice--info")
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
        + btn(ctx.page("headers"), t("Заголовки для провайдеров", "Provider headers"),
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
