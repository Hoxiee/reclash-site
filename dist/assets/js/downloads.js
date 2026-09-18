/* Downloads page. Detects the visitor's platform, then tries the GitHub
   releases API. If there is no published release yet — and today there is
   none — the page says so plainly instead of inventing a link. */
(function () {
  'use strict';

  var page = document.getElementById('downloads');
  if (!page) return;

  var $ = RC.$, $$ = RC.$$;
  var S = {};
  try { S = JSON.parse(document.getElementById('dl-strings').textContent); } catch (e) {}
  function s(k) { return S[k] !== undefined ? S[k] : k; }

  var REPO = page.getAttribute('data-repo') || 'Hoxiee/ReClash';

  /* ------------------------------------------------------ platform guess */

  function detect() {
    var ua = navigator.userAgent || '';
    var uad = navigator.userAgentData;
    var plat = (uad && uad.platform) || navigator.platform || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(plat) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Win/i.test(plat) || /Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(plat) || /Mac OS X/i.test(ua)) return 'macos';
    if (/Linux|X11|CrOS/i.test(plat + ua)) return 'linux';
    return 'windows';
  }

  function arch() {
    var ua = navigator.userAgent || '';
    if (/arm64|aarch64/i.test(ua)) return 'arm64';
    if (/WOW64|Win64|x86_64|x64/i.test(ua)) return 'x64';
    return '';
  }

  var current = detect();
  page.setAttribute('data-os', current);

  $$('[data-os-name]').forEach(function (el) { el.textContent = s('os_' + current); });
  $$('[data-os-icon]').forEach(function (el) {
    var tpl = document.getElementById('icon-' + current);
    if (tpl) el.innerHTML = tpl.innerHTML;
  });
  var archEl = $('[data-arch]');
  if (archEl) archEl.textContent = arch() ? arch() : '';

  /* mark the matching platform card */
  $$('[data-platform]').forEach(function (card) {
    if (card.getAttribute('data-platform') === current) card.setAttribute('data-current', 'true');
  });

  /* ----------------------------------------------------- asset grouping */

  var RULES = [
    { os: 'windows', test: /(\.exe|\.msi|windows|win-?(x64|arm64|32))/i },
    { os: 'macos', test: /(\.dmg|\.pkg|macos|darwin|osx)/i },
    { os: 'linux', test: /(\.appimage|\.deb|\.rpm|\.tar\.gz|linux)/i },
    { os: 'android', test: /(\.apk|android)/i },
    { os: 'ios', test: /(\.ipa|ios)/i }
  ];

  function osOf(name) {
    for (var i = 0; i < RULES.length; i++) if (RULES[i].test.test(name)) return RULES[i].os;
    return 'other';
  }

  function label(name) {
    var m = /(arm64|aarch64|armeabi-v7a|x86_64|amd64|x64|universal|x86|arm32)/i.exec(name);
    var ext = /\.([a-z0-9]+)(\.gz)?$/i.exec(name);
    var parts = [];
    if (ext) parts.push((ext[2] ? ext[1] + ext[2] : ext[1]).toLowerCase());
    if (m) parts.push(m[1].toLowerCase());
    return parts.length ? parts.join(' · ') : name;
  }

  function size(n) {
    if (!n) return '';
    return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1024).toFixed(0) + ' KB';
  }

  /* --------------------------------------------------------------- fetch */

  var loading = $('#dl-loading');
  var empty = $('#dl-empty');
  var failed = $('#dl-failed');
  var listBox = $('#dl-assets');
  var relBox = $('#dl-release');

  function state(which) {
    [loading, empty, failed].forEach(function (el) { if (el) el.hidden = true; });
    if (which) which.hidden = false;
  }

  function render(rel) {
    var assets = (rel.assets || []).filter(function (a) { return a.name && a.browser_download_url; });
    if (!assets.length) { state(empty); return; }

    var groups = {};
    assets.forEach(function (a) {
      var os = osOf(a.name);
      (groups[os] = groups[os] || []).push(a);
    });

    var orderOs = ['windows', 'macos', 'linux', 'android', 'ios', 'other'];
    if (orderOs.indexOf(current) > 0) {
      orderOs.splice(orderOs.indexOf(current), 1);
      orderOs.unshift(current);
    }

    var html = '';
    orderOs.forEach(function (os) {
      if (!groups[os]) return;
      var tpl = document.getElementById('icon-' + os);
      html += '<div class="dl-row"' + (os === current ? ' data-current="true"' : '') + '>' +
        '<span class="dl-row__icon">' + (tpl ? tpl.innerHTML : '') + '</span>' +
        '<span><span class="dl-row__name">' + (s('os_' + os) || os) + '</span>' +
        '<span class="dl-row__meta">' + groups[os].length + ' ' + s('files') + '</span></span>' +
        '<span class="dl-row__arch">' +
        groups[os].map(function (a) {
          return '<a class="dl-asset" href="' + a.browser_download_url + '" rel="noopener">' +
            label(a.name) + (a.size ? ' <span class="faint">' + size(a.size) + '</span>' : '') + '</a>';
        }).join('') +
        '</span></div>';
    });

    if (listBox) listBox.innerHTML = html;

    if (relBox) {
      var when = rel.published_at ? new Date(rel.published_at).toLocaleDateString(document.documentElement.lang) : '';
      var notes = (rel.body || '').trim();
      if (notes.length > 2400) notes = notes.slice(0, 2400) + '…';
      relBox.innerHTML = '<div class="release__head">' +
        '<span class="release__tag">' + (rel.tag_name || rel.name || '') + '</span>' +
        (when ? '<span class="mono faint">' + when + '</span>' : '') +
        '<a class="link link--cyan" href="' + rel.html_url + '" rel="noopener">' + s('onGithub') + '</a>' +
        '</div>' +
        (notes ? '<div class="release__notes">' + notes.replace(/[<>]/g, '') + '</div>' : '');
      relBox.hidden = false;
    }

    state(null);
  }

  state(loading);

  fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=5', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    })
    .then(function (list) {
      var rel = (list || []).filter(function (r) { return !r.draft; })[0];
      if (!rel) { state(empty); return; }
      render(rel);
    })
    .catch(function () { state(failed); });
})();
