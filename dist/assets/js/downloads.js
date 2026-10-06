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

  /* --------------------------------------------- release notes (markdown)
     GitHub release bodies are Markdown. The old page dumped them as text with
     angle brackets stripped, which turned every heading, list and alert into
     noise. This renders the small subset a release actually uses — and does it
     safely: each value is HTML-escaped before any tag is introduced, and only
     http(s) links are emitted. When the body carries the reclash:changelog
     begin/end markers, only the intro and the curated changelog are shown; the
     rest (download tables, shield badges) stays behind the GitHub link. */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inlineMd(raw) {
    /* pull code spans out first so emphasis/link rules never reach inside */
    var codes = [];
    var s = esc(raw).replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, txt, url) {
      return '<a href="' + url + '" rel="noopener" target="_blank">' + txt + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^\w`])_([^_\s][^_]*?)_/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return '<code>' + codes[+i] + '</code>';
    });
  }

  var ALERT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;

  function markdown(src) {
    var lines = String(src || '').replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
    var out = [], para = [], i = 0;

    function flush() {
      if (para.length) { out.push('<p>' + inlineMd(para.join(' ')) + '</p>'); para = []; }
    }

    while (i < lines.length) {
      var t = lines[i].trim();

      if (!t) { flush(); i++; continue; }

      if (t.charAt(0) === '>') {
        var head = t.replace(/^>\s?/, '');
        var m = ALERT.exec(head);
        if (m) {
          flush();
          var kind = m[1].toLowerCase();
          var buf = [];
          i++;
          while (i < lines.length && lines[i].trim().charAt(0) === '>') {
            buf.push(lines[i].trim().replace(/^>\s?/, ''));
            i++;
          }
          var body = buf.filter(function (x) { return x; })
            .map(function (x) { return inlineMd(x); }).join('<br>');
          out.push('<div class="release__alert" data-kind="' + kind + '">' +
            '<span class="release__alert__kind">' + kind + '</span>' + body + '</div>');
          continue;
        }
        para.push(head);   // a plain blockquote line folds into the paragraph
        i++;
        continue;
      }

      var h = /^(#{1,6})\s+(.+)$/.exec(t);
      if (h) {
        flush();
        var tag = h[1].length <= 3 ? 'h4' : 'h5';
        out.push('<' + tag + '>' + inlineMd(h[2]) + '</' + tag + '>');
        i++;
        continue;
      }

      if (/^[-*+]\s+/.test(t)) {
        flush();
        out.push('<ul>');
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          out.push('<li>' + inlineMd(lines[i].trim().replace(/^[-*+]\s+/, '')) + '</li>');
          i++;
        }
        out.push('</ul>');
        continue;
      }

      if (/^\d+\.\s+/.test(t)) {
        flush();
        out.push('<ol>');
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          out.push('<li>' + inlineMd(lines[i].trim().replace(/^\d+\.\s+/, '')) + '</li>');
          i++;
        }
        out.push('</ol>');
        continue;
      }

      para.push(t);
      i++;
    }
    flush();
    return out.join('');
  }

  function releaseNotes(body) {
    var src = String(body || '');
    var begin = /<!--\s*reclash:changelog:begin\s*-->/.exec(src);
    var end = /<!--\s*reclash:changelog:end\s*-->/.exec(src);
    if (begin && end && end.index > begin.index) {
      return markdown(src.slice(0, begin.index)) +
        markdown(src.slice(begin.index + begin[0].length, end.index));
    }
    var fb = src.trim();
    if (fb.length > 2400) fb = fb.slice(0, 2400) + '\n\n…';
    return markdown(fb);
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
      var pills = groups[os].map(function (a) {
        return '<a class="dl-asset" href="' + esc(a.browser_download_url) + '" rel="noopener">' +
          esc(label(a.name)) + (a.size ? ' <span class="faint">' + size(a.size) + '</span>' : '') + '</a>';
      }).join('');
      html += '<div class="dl-row"' + (os === current ? ' data-current="true"' : '') + '>' +
        '<span class="dl-row__icon">' + (tpl ? tpl.innerHTML : '') + '</span>' +
        '<div class="dl-row__body">' +
          '<div class="dl-row__head">' +
            '<span class="dl-row__name">' + esc(s('os_' + os) || os) + '</span>' +
            '<span class="dl-row__meta">' + groups[os].length + ' ' + esc(s('files')) + '</span>' +
          '</div>' +
          '<div class="dl-row__files">' + pills + '</div>' +
        '</div>' +
        '</div>';
    });

    if (listBox) listBox.innerHTML = html;

    if (relBox) {
      var when = rel.published_at ? new Date(rel.published_at).toLocaleDateString(document.documentElement.lang) : '';
      var notes = releaseNotes(rel.body);
      relBox.innerHTML = '<div class="release__head">' +
        '<span class="release__tag">' + esc(rel.tag_name || rel.name || '') + '</span>' +
        (when ? '<span class="mono faint">' + esc(when) + '</span>' : '') +
        '<a class="link link--cyan" href="' + esc(rel.html_url) + '" rel="noopener">' + esc(s('onGithub')) + '</a>' +
        '</div>' +
        (notes ? '<div class="release__notes">' + notes + '</div>' : '');
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

  /* ------------------------------------------------ SHA256 verifier
     Pick or drop a file, hash it locally with the Web Crypto API (the file is
     never uploaded), and compare against a value pasted from the release —
     either a bare 64-hex digest or a whole SHA256SUMS listing, where the line
     is matched by the dropped file's name. */

  var vRoot = $('[data-verify]');
  if (vRoot) (function () {
    var drop = $('[data-drop]', vRoot);
    var fileIn = $('[data-file]', vRoot);
    var dropCap = $('[data-drop-cap]', vRoot);
    var hashBox = $('[data-hash-box]', vRoot);
    var hashOut = $('[data-hash]', vRoot);
    var expect = $('[data-expect]', vRoot);
    var verdict = $('[data-verdict]', vRoot);
    if (!drop || !fileIn || !hashOut || !expect || !verdict) return;

    var subtle = window.crypto && window.crypto.subtle;
    var HEX = /\b[0-9a-f]{64}\b/;
    var curHash = '';   // hash of the file in hand, '' while none/computing
    var curName = '';   // its name, for matching a SHA256SUMS line
    var token = 0;      // guards against a slow hash landing after a newer file
    var lastSay = '';   // last verdict shown, so a settle pops only on change

    /* Replay the shared one-shot CSS pop (rc-dl-pop) the way home.js/builder
       flash diffs: drop the flag, force a reflow, set it again, so a rapid
       repeat still restarts the spring. Cleared after the animation so the
       attribute never lingers. Gated on reduced motion — the resting state
       (flag absent, text and tone already set) never depends on it. */
    function pop(el) {
      if (!el || RC.reduced) return;
      el.removeAttribute('data-pop');
      void el.offsetWidth;
      el.setAttribute('data-pop', 'true');
      if (el.__popT) clearTimeout(el.__popT);
      el.__popT = setTimeout(function () { el.removeAttribute('data-pop'); }, 520);
    }

    function say(key, tone) {
      verdict.textContent = s(key);
      verdict.setAttribute('data-tone', tone);
      /* Pop only as the verdict settles into a conclusive tone, and only when
         it actually changes — not on every keystroke that keeps a match, and
         never on the idle hint or the busy spinner. */
      var sig = tone + ':' + key;
      if (sig !== lastSay && tone !== 'idle' && tone !== 'busy') pop(verdict);
      lastSay = sig;
    }

    /* What the pasted text expects for THIS file: a single digest wins; a
       SHA256SUMS is scanned for the line naming this file, else — if only one
       digest is present at all — that one. Returns {hash} or {notfound}. */
    function expected(text, name) {
      var lines = text.split(/\r?\n/);
      var hashes = [];
      var byName = null;
      var base = (name || '').toLowerCase();
      lines.forEach(function (ln) {
        var m = ln.match(HEX);
        if (!m) return;
        hashes.push(m[0]);
        if (base && ln.toLowerCase().indexOf(base) !== -1) byName = m[0];
      });
      if (byName) return { hash: byName };
      if (hashes.length === 1) return { hash: hashes[0] };
      if (hashes.length > 1) {
        /* several sums, none names this file: a match on any is still a match,
           otherwise we cannot say which line was meant */
        if (hashes.indexOf(curHash) !== -1) return { hash: curHash };
        return { notfound: true };
      }
      return {};
    }

    function compare() {
      var text = (expect.value || '').trim();
      if (!curHash) { say(text ? 'v_needfile' : 'v_hint', 'idle'); return; }
      if (!text) { say('v_needexp', 'idle'); return; }
      var exp = expected(text, curName);
      if (exp.notfound) { say('v_notfound', 'warn'); return; }
      if (!exp.hash) { say('v_needexp', 'idle'); return; }
      var ok = exp.hash === curHash;
      say(ok ? 'v_match' : 'v_mismatch', ok ? 'good' : 'bad');
    }

    function toHex(buf) {
      var b = new Uint8Array(buf), out = '';
      for (var i = 0; i < b.length; i++) out += (b[i] + 0x100).toString(16).slice(1);
      return out;
    }

    function hashFile(file) {
      if (!file) return;
      curHash = '';
      curName = file.name || '';
      dropCap.textContent = curName + (file.size ? '  ·  ' + size(file.size) : '');
      drop.setAttribute('data-has-file', 'true');
      pop(drop);   // one springy pop confirms the drop, no layout shift
      if (!subtle || !window.isSecureContext) {
        hashBox.hidden = true;
        say('v_unsupported', 'warn');
        return;
      }
      hashBox.hidden = false;
      hashOut.textContent = s('v_computing');
      var mine = ++token;
      say('v_computing', 'busy');
      file.arrayBuffer()
        .then(function (buf) { return subtle.digest('SHA-256', buf); })
        .then(function (dg) {
          if (mine !== token) return;   // a newer file superseded this one
          curHash = toHex(dg);
          hashOut.textContent = curHash;
          compare();
        })
        .catch(function () {
          if (mine !== token) return;
          hashBox.hidden = true;
          say('v_error', 'warn');
        });
    }

    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); }
    });
    fileIn.addEventListener('change', function () {
      if (fileIn.files && fileIn.files[0]) hashFile(fileIn.files[0]);
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.setAttribute('data-over', 'true');
      });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      drop.addEventListener(ev, function () { drop.removeAttribute('data-over'); });
    });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.removeAttribute('data-over');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) hashFile(f);
    });
    expect.addEventListener('input', compare);
  })();
})();
