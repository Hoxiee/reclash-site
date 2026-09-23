/* Provider header builder: form -> validated headers -> live in-app preview
   and ready-to-paste server snippets. All rules follow PROVIDER_HEADERS.md. */
(function () {
  'use strict';

  var form = document.getElementById('builder');
  if (!form) return;

  var $ = RC.$, $$ = RC.$$;
  var S = {}, WIDGETS = [], RWTPL = null;
  try { S = JSON.parse(document.getElementById('builder-strings').textContent); } catch (e) {}
  try { WIDGETS = JSON.parse(document.getElementById('widget-spec').textContent); } catch (e) {}
  try { RWTPL = JSON.parse(document.getElementById('remnawave-template').textContent); } catch (e) {}
  function s(k) { return S[k] !== undefined ? S[k] : k; }

  /* "4 заголовков" is wrong. Russian picks the form from the last digits and
     the table gives one|few|many; English sends two forms and the same lookup
     lands on singular vs plural. */
  function plural(k, n) {
    var f = s(k).split('|');
    if (f.length < 3) return f[n === 1 ? 0 : 1] || f[0];
    var d = n % 10, dd = n % 100;
    if (d === 1 && dd !== 11) return f[0];
    if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return f[1];
    return f[2];
  }

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function on(id) { var el = document.getElementById(id); return !!(el && el.checked); }
  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function b64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function isAscii(str) { return /^[\x20-\x7e]*$/.test(str); }
  /* Inverse of b64() — used to turn a collect()ed `base64:<payload>` value
     back into text for the global-headers `rwEncodeBase64:` transform. */
  function b64decode(str) {
    try {
      var bin = atob(str);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) { return str; }
  }

  /* ---------------------------------------------------- colour utilities */

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 8) h = h.slice(2);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, sat = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var dd = mx - mn;
      sat = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      if (mx === r) h = (g - b) / dd + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / dd + 2;
      else h = (r - g) / dd + 4;
      h *= 60;
    }
    return [h, sat * 100, l * 100];
  }
  function hsl(h, sa, l) { return 'hsl(' + ((h % 360) + 360) % 360 + ' ' + Math.max(0, Math.min(100, sa)) + '% ' + Math.max(0, Math.min(100, l)) + '%)'; }

  /* Approximation of the Material scheme ReClash derives from reclash-hex. */
  function scheme(hexValue, variant, pureblack) {
    var rgb = hexToRgb(hexValue);
    var c = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    var h = c[0], sat = c[1];
    var accentS = sat, accentL = 70, hue = h, surfS = 10;

    if (variant === 'monochrome') { accentS = 0; surfS = 0; }
    else if (variant === 'neutral') { accentS = Math.min(sat, 14); surfS = 5; }
    else if (variant === 'vibrant') { accentS = Math.max(sat, 88); surfS = 14; accentL = 68; }
    else if (variant === 'expressive') { hue = h + 48; accentS = Math.max(sat, 62); surfS = 13; }
    else if (variant === 'fidelity' || variant === 'content') { accentS = Math.max(sat, 40); surfS = 11; accentL = 66; }
    else { accentS = Math.min(Math.max(sat, 36), 74); surfS = 10; } /* tonalspot */

    return {
      hue: ((hue % 360) + 360) % 360,
      accent: hsl(hue, accentS, accentL),
      accent2: hsl(hue + 34, Math.max(accentS - 10, 0), 62),
      bg: pureblack ? '#000000' : hsl(hue, surfS, 6),
      surface: pureblack ? '#0a0a0c' : hsl(hue, surfS, 9),
      surface2: pureblack ? '#121215' : hsl(hue, surfS, 13),
      line: pureblack ? '#26262b' : hsl(hue, surfS + 4, 18),
      text: pureblack ? '#f2f2f4' : hsl(hue, 12, 94),
      dim: hsl(hue, 8, 66)
    };
  }

  /* -------------------------------------------------------- widget order */

  var order = WIDGETS.map(function (w) { return w.id; });
  var enabled = {};
  WIDGETS.forEach(function (w) { enabled[w.id] = !!w.on; });

  var listEl = document.getElementById('widget-order');

  function renderWidgetList() {
    if (!listEl) return;
    listEl.innerHTML = '';
    order.forEach(function (id, idx) {
      var w = WIDGETS.filter(function (x) { return x.id === id; })[0];
      if (!w) return;
      var row = document.createElement('div');
      row.className = 'orderitem';
      row.setAttribute('data-on', enabled[id] ? 'true' : 'false');
      row.innerHTML =
        '<label class="check"><input type="checkbox" ' + (enabled[id] ? 'checked' : '') +
        ' data-w="' + esc(id) + '"><span class="visually-hidden">' + esc(w.label) + '</span></label>' +
        '<span class="orderitem__name">' + esc(id) + '</span>' +
        '<span class="orderitem__plat">' + esc(w.plat) + '</span>' +
        '<button type="button" class="orderitem__mv" data-mv="up" ' + (idx === 0 ? 'disabled' : '') +
        ' aria-label="' + esc(s('moveUp')) + '">&#9650;</button>' +
        '<button type="button" class="orderitem__mv" data-mv="down" ' + (idx === order.length - 1 ? 'disabled' : '') +
        ' aria-label="' + esc(s('moveDown')) + '">&#9660;</button>';
      row.title = w.label;
      listEl.appendChild(row);

      $('input', row).addEventListener('change', function (e) {
        enabled[id] = e.target.checked;
        row.setAttribute('data-on', e.target.checked ? 'true' : 'false');
        update();
      });
      $$('[data-mv]', row).forEach(function (b) {
        b.addEventListener('click', function () {
          var to = b.getAttribute('data-mv') === 'up' ? idx - 1 : idx + 1;
          if (to < 0 || to >= order.length) return;
          var tmp = order[idx]; order[idx] = order[to]; order[to] = tmp;
          renderWidgetList();
          update();
        });
      });
    });
  }

  /* ------------------------------------------------------------- headers */

  function textField(id, b64id, warn) {
    var raw = val(id);
    if (!raw) return null;
    var force = b64id ? on(b64id) : false;
    if (force || !isAscii(raw)) return 'base64:' + b64(raw);
    void warn;
    return raw;
  }

  function collect() {
    var out = [];
    var warn = [];
    function push(name, value) { if (value !== null && value !== undefined && value !== '') out.push([name, value]); }
    function err(msg, hard) { warn.push({ text: msg, hard: !!hard }); }

    function checkUrl(raw, label, allowHttp) {
      if (!raw) return null;
      var u;
      try { u = new URL(raw); } catch (e) { err(label + ': ' + s('errUrl'), true); return null; }
      if (u.protocol !== 'https:' && !(allowHttp && u.protocol === 'http:')) {
        err(label + ': ' + s('errHttps'), true);
        return null;
      }
      if (u.username || u.password) { err(label + ': ' + s('errCreds'), true); return null; }
      return u.href;
    }

    /* --- traffic -------------------------------------------------------
       Past 2^53 bytes a double stops counting whole numbers, and the value
       lands in the header as 1e+21 — which no client can parse. 8 PiB is
       where that happens, so the field stops there and says so. */
    var GB = 1073741824;
    var MAX_GB = 8388608;
    var clamped = false;
    function gb(id) {
      var n = parseFloat(val(id));
      if (!isFinite(n) || n < 0) { if (val(id) && !(n >= 0)) clamped = true; return 0; }
      if (n > MAX_GB) { clamped = true; return MAX_GB; }
      return n;
    }
    var up = gb('f_up');
    var down = gb('f_down');
    var total = gb('f_total');
    var expire = val('f_expire');
    /* Subscription-Userinfo is per-user, and the panel (Remnawave) or your own
       backend emits it on every request from the subscriber's real plan — so
       the builder never writes it as a configured header. These four fields
       only drive the live preview's subscription card and the commented
       example the self-host snippets carry. */
    if (clamped) err(s('warnQuotaRange'));
    var uparts = [
      'upload=' + Math.round(up * GB),
      'download=' + Math.round(down * GB),
      'total=' + Math.round(total * GB)
    ];
    if (expire) {
      var ts = Math.floor(new Date(expire + 'T00:00:00Z').getTime() / 1000);
      if (!isNaN(ts)) uparts.push('expire=' + ts);
    }
    if (total > 0 && up + down > total) err(s('warnOverQuota'));
    var userinfo = uparts.join('; ');

    /* --- identity ------------------------------------------------------ */
    var title = textField('f_title');
    push('Profile-Title', title);

    var svcName = textField('f_svcname', 'f_svcname_b64');
    push('ReClash-ServiceName', svcName);

    /* The headline on the connection screen. Same Base64 rule as the name:
       anything outside printable ASCII has to be encoded or the header is not
       a legal HTTP field value. */
    push('ReClash-ActiveText', textField('f_activetext'));

    var logo = checkUrl(val('f_logo'), s('lblLogo'));
    push('ReClash-ServiceLogo', logo);
    if (logo && !/\.(png|svg|webp|jpg|jpeg)(\?|$)/i.test(logo)) err(s('warnLogoExt'));

    var srvInfo = textField('f_serverinfo');
    push('ReClash-ServerInfo', srvInfo);

    /* --- links --------------------------------------------------------- */
    push('ReClash-SupportURL', checkUrl(val('f_support'), s('lblSupport')));
    push('ReClash-BuyPlan', checkUrl(val('f_buyplan'), s('lblBuyPlan')));
    push('ReClash-BuyTraffic', checkUrl(val('f_buytraffic'), s('lblBuyTraffic')));

    /* --- announce ------------------------------------------------------ */
    var ann = val('f_announce');
    if (ann) {
      if (/[<>]/.test(ann)) err(s('warnMarkup'));
      if (ann.length > 180) err(s('warnAnnounceLong'));
      if (/[\r\n]/.test(ann)) { err(s('warnAnnounceNl')); ann = ann.replace(/\s*[\r\n]+\s*/g, ' '); }
      push('ReClash-Announce', (on('f_announce_b64') || !isAscii(ann)) ? 'base64:' + b64(ann) : ann);
    }

    /* --- update interval ----------------------------------------------- */
    var iv = val('f_interval');
    if (iv) {
      var n = parseInt(iv, 10);
      if (!(n > 0)) err(s('errInterval'), true);
      else {
        push('ReClash-AutoUpdateInterval', String(n));
        if (n < 10) err(s('warnIntervalSmall'));
      }
    }

    /* --- theme --------------------------------------------------------- */
    var hexRaw = val('f_hex').replace('#', '').toUpperCase();
    var variant = val('f_variant');
    if (on('f_theme')) {
      if (!/^([0-9A-F]{6}|[0-9A-F]{8})$/.test(hexRaw)) err(s('errHex'), true);
      else {
        var tok = [hexRaw];
        if (variant && variant !== 'tonalspot') tok.push(variant);
        if (on('f_pureblack')) tok.push('pureblack');
        push('ReClash-Hex', tok.join(':'));
      }
    }

    /* --- background ---------------------------------------------------- */
    if (on('f_bg')) {
      var bgUrl = checkUrl(val('f_bgurl'), s('lblBg'), true);
      var op = parseInt(val('f_bgop'), 10);
      if (bgUrl) {
        if (isNaN(op) || op < 1 || op > 100) { err(s('errOpacity'), true); }
        else push('ReClash-Background', bgUrl + ',' + op);
      }
    }

    /* --- hero ring ------------------------------------------------------ */
    if (on('f_ring')) {
      var ring = ['f_ring1', 'f_ring2', 'f_ring3'].map(function (id) {
        return val(id).replace('#', '').toUpperCase();
      });
      var bad = ring.filter(function (c) { return !/^([0-9A-F]{6}|[0-9A-F]{8})$/.test(c); });
      if (bad.length) err(s('errRing'), true);
      else push('ReClash-HeroRing', ring.join(';'));
    }

    /* --- hero effect ---------------------------------------------------- */
    if (on('f_heroeffect')) push('ReClash-HeroEffect', 'aurora');

    /* --- proxy view ----------------------------------------------------- */
    if (on('f_view')) {
      var view = [
        'type:' + val('f_view_type'),
        'sort:' + val('f_view_sort'),
        'layout:' + val('f_view_layout'),
        'icon:' + val('f_view_icon'),
        'card:' + val('f_view_card')
      ];
      push('ReClash-View', view.join('; '));
      if (val('f_view_card') === 'oneline') err(s('warnOneline'));
    }

    /* --- widgets --------------------------------------------------------- */
    var chosen = order.filter(function (id) { return enabled[id]; });
    if (on('f_widgets') && chosen.length) {
      push('ReClash-Widgets', chosen.join(','));
      push('ReClash-Custom', val('f_custom'));
      var mixed = chosen.filter(function (id) {
        var w = WIDGETS.filter(function (x) { return x.id === id; })[0];
        return w && w.plat !== 'all';
      });
      if (mixed.length) err(s('warnPlatform').replace('{n}', mixed.join(', ')));
    }

    /* --- initial settings ------------------------------------------------ */
    if (on('f_settings')) {
      var tokens = $$('[data-setting]:checked', form).map(function (i) { return i.getAttribute('data-setting'); });
      push('ReClash-Settings', tokens.join(','));
      err(s('warnSettings'));
    }

    /* --- migration -------------------------------------------------------- */
    var nd = val('f_newdomain');
    if (nd) {
      if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(nd) || /\//.test(nd)) err(s('errDomain'), true);
      else push('ReClash-NewDomain', nd.toLowerCase());
    }
    var fh = val('f_fallback');
    if (fh) {
      var hosts = fh.split(/[,\s]+/).filter(Boolean).map(function (h) { return h.toLowerCase(); });
      if (hosts.some(function (h) { return h.indexOf(':') !== -1; })) err(s('errFallbackPort'), true);
      var uniq = hosts.filter(function (h, i) { return hosts.indexOf(h) === i; });
      if (uniq.length > 4) { err(s('warnFallbackMax')); uniq = uniq.slice(0, 4); }
      if (uniq.length) push('ReClash-FallbackHosts', uniq.join(','));
    }

    /* --- FlClashX aliases -------------------------------------------------- */
    if (on('f_aliases')) {
      var map = {
        'ReClash-SupportURL': 'FlClashX-SupportURL',
        'ReClash-ServiceName': 'FlClashX-ServiceName',
        'ReClash-ServiceLogo': 'FlClashX-ServiceLogo',
        'ReClash-ServerInfo': 'FlClashX-ServerInfo',
        'ReClash-BuyPlan': 'FlClashX-BuyPlan',
        'ReClash-BuyTraffic': 'FlClashX-BuyTraffic',
        'ReClash-View': 'FlClashX-View',
        'ReClash-Hex': 'FlClashX-Hex',
        'ReClash-Background': 'FlClashX-Background',
        'ReClash-NewDomain': 'FlClashX-NewDomain'
      };
      var extra = [];
      out.forEach(function (pair) {
        if (map[pair[0]]) extra.push([map[pair[0]], pair[1]]);
      });
      out = out.concat(extra);
    }

    if (!out.length) err(s('warnEmpty'));

    return {
      headers: out,
      warnings: warn,
      userinfo: userinfo,
      preview: {
        name: val('f_svcname') || s('defService'),
        /* Profile-Title becomes the profile's label, which is the first line
           of the subscription tile — so the field has somewhere visible to
           land instead of only showing up in the generated headers. */
        title: val('f_title'),
        activeText: val('f_activetext'),
        logo: val('f_logo'),
        announce: val('f_announce'),
        support: val('f_support'),
        buyPlan: val('f_buyplan'),
        buyTraffic: val('f_buytraffic'),
        serverInfo: val('f_serverinfo') || 'Proxy',
        interval: parseInt(val('f_interval'), 10) || 0,
        up: up, down: down, total: total, expire: expire,
        /* The panel always emits Subscription-Userinfo, so the subscription
           card is always part of the preview; the quota/expiry above are the
           sample it renders. */
        userinfo: true,
        hex: /^([0-9A-F]{6}|[0-9A-F]{8})$/.test(hexRaw) ? hexRaw : '7C5CFF',
        variant: variant,
        pureblack: on('f_pureblack'),
        theme: on('f_theme'),
        bg: on('f_bg') ? val('f_bgurl') : '',
        bgOpacity: parseInt(val('f_bgop'), 10) || 10,
        ring: on('f_ring') ? ['f_ring1', 'f_ring2', 'f_ring3'].map(function (i) { return val(i); }) : null,
        heroEffect: on('f_heroeffect'),
        widgets: on('f_widgets') ? chosen : ['networkSpeed', 'outboundModeV2', 'trafficUsage'],
        view: on('f_view') ? {
          type: val('f_view_type'), sort: val('f_view_sort'), layout: val('f_view_layout'),
          icon: val('f_view_icon'), card: val('f_view_card')
        } : { type: 'tab', sort: 'default', layout: 'standard', icon: 'standard', card: 'expand' }
      }
    };
  }

  /* ---------------------------------------------------------- code output */

  function httpBlock(headers, uinfo) {
    var lines = ['HTTP/1.1 200 OK', 'Content-Type: application/yaml; charset=utf-8'];
    /* Subscription-Userinfo is part of the response the client receives, but
       the backend fills it per user — it is shown, never configured here. */
    if (uinfo) lines.push('Subscription-Userinfo: ' + uinfo);
    headers.forEach(function (h) { lines.push(h[0] + ': ' + h[1]); });
    return lines.join('\n');
  }

  /* Headers a subscription panel already emits by itself. add_header appends,
     it does not replace, so without proxy_hide_header the response carries the
     panel's value and ours at once and the client keeps whichever came first.
     ReClash-* is ours alone and can never collide. */
  var PANEL_HEADERS = {
    'subscription-userinfo': 1, 'profile-title': 1, 'profile-update-interval': 1,
    'profile-web-page-url': 1, 'support-url': 1, 'content-disposition': 1,
    'announce': 1
  };

  function nginxBlock(headers, uinfo) {
    var q = function (v) { return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); };
    var hide = headers
      .filter(function (h) { return PANEL_HEADERS[h[0].toLowerCase()]; })
      .map(function (h) { return '    proxy_hide_header ' + h[0] + ';'; });
    var add = headers.map(function (h) {
      return '    add_header ' + h[0] + ' "' + q(h[1]) + '" always;';
    });
    return '# ' + s('sniPath') + '\n' +
      'location /sub {\n' +
      (hide.length ? '    # ' + s('sniHide') + '\n' + hide.join('\n') + '\n\n' : '') +
      '    # ' + s('sniAdd') + '\n' +
      add.join('\n') + '\n\n' +
      '    # ' + s('sniUserinfo') + '\n' +
      '    # add_header Subscription-Userinfo "' + q(uinfo) + '" always;\n\n' +
      '    # ' + s('sniPort') + '\n' +
      '    proxy_pass http://127.0.0.1:8000;\n' +
      '    proxy_set_header Host $host;\n' +
      '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n' +
      '    proxy_set_header X-Forwarded-Proto $scheme;\n' +
      '}';
  }

  function caddyBlock(headers, uinfo) {
    var body = headers.map(function (h) {
      return '        ' + h[0] + ' "' + h[1].replace(/"/g, '\\"') + '"';
    }).join('\n');
    /* Caddy's header directive sets rather than appends, so the panel's own
       copy is overwritten and there is nothing to hide. */
    return '# ' + s('sniCaddyPath') + '\n' +
      'handle /sub* {\n    header {\n' + body + '\n    }\n' +
      '    # ' + s('sniUserinfo') + '\n' +
      '    # header Subscription-Userinfo "' + uinfo.replace(/"/g, '\\"') + '"\n' +
      '    # ' + s('sniPort') + '\n' +
      '    reverse_proxy 127.0.0.1:8000\n}';
  }

  function phpBlock(headers, uinfo) {
    var body = headers.map(function (h) {
      return "header('" + h[0] + ": " + h[1].replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "');";
    }).join('\n');
    return '<?php\n' +
      "header('Content-Type: application/yaml; charset=utf-8');\n" +
      body + '\n\n' +
      '// ' + s('sniUserinfo') + '\n' +
      "// header('Subscription-Userinfo: " + uinfo.replace(/'/g, "\\'") + "');\n\n" +
      'readfile(__DIR__ . \'/config.yaml\');';
  }

  function goBlock(headers, uinfo) {
    var body = headers.map(function (h) {
      return '\th.Set("' + h[0] + '", "' + h[1].replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
    }).join('\n');
    return 'func writeSubscription(w http.ResponseWriter, body []byte) {\n' +
      '\th := w.Header()\n' +
      '\th.Set("Content-Type", "application/yaml; charset=utf-8")\n' +
      body + '\n' +
      '\t// ' + s('sniUserinfo') + '\n' +
      '\t// h.Set("Subscription-Userinfo", "' + uinfo.replace(/"/g, '\\"') + '")\n' +
      '\tw.WriteHeader(http.StatusOK)\n\t_, _ = w.Write(body)\n}';
  }

  function pyBlock(headers, uinfo) {
    var body = headers.map(function (h) {
      return '    "' + h[0] + '": "' + h[1].replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '",';
    }).join('\n');
    return 'SUBSCRIPTION_HEADERS = {\n' + body + '\n}\n\n' +
      '# ' + s('sniUserinfo') + '\n' +
      '# SUBSCRIPTION_HEADERS["Subscription-Userinfo"] = "' + uinfo.replace(/"/g, '\\"') + '"\n\n' +
      '@app.get("/sub")\n' +
      'def sub() -> Response:\n' +
      '    return Response(\n' +
      '        content=build_config(),\n' +
      '        media_type="application/yaml",\n' +
      '        headers=SUBSCRIPTION_HEADERS,\n' +
      '    )';
  }

  /* ------------------------------------------------------- Remnawave out */

  /* Remnawave emits Subscription-Userinfo and Content-Disposition itself, so
     the panel artefacts must not repeat them, or the client sees two values. */
  function rwHeaderSet(headers) {
    return headers.filter(function (h) {
      var n = h[0].toLowerCase();
      return n !== 'subscription-userinfo' && n !== 'content-disposition';
    });
  }

  function rwOpts() {
    var locales = [];
    if (on('f_rw_en')) locales.push('en');
    if (on('f_rw_ru')) locales.push('ru');
    if (!locales.length) locales.push('en');
    return {
      fallback: val('f_rw_fallback') || 'CLASH',
      disableHwid: on('f_rw_hwid'),
      locales: locales,
      suburl: val('f_rw_suburl')
    };
  }

  /* Subscription Response Rules. Rules match top to bottom and the first hit
     wins; if none match while SRR is on, the panel answers 403 — so the config
     is always the ReClash rule plus a catch-all fallback, never just one. */
  function srrBlock(headers, opts) {
    var mods = {
      headers: rwHeaderSet(headers).map(function (h) { return { key: h[0], value: h[1] }; }),
      applyHeadersToEnd: true,
      additionalExtendedClientsRegex: ['^ReClash/']
    };
    if (opts.disableHwid) mods.disableHwidCheck = true;
    var reclash = {
      name: 'ReClash',
      description: 'Serve mihomo with ReClash provider headers to ReClash and FlClashX clients.',
      enabled: true,
      operator: 'OR',
      conditions: [
        { headerName: 'user-agent', operator: 'STARTS_WITH', value: 'ReClash/', caseSensitive: false },
        { headerName: 'user-agent', operator: 'STARTS_WITH', value: 'FlClashX/', caseSensitive: false }
      ],
      responseType: 'MIHOMO',
      responseModifications: mods
    };
    var fallback = {
      name: 'All other clients',
      description: 'Catch-all so non-ReClash clients are not answered with 403.',
      enabled: true,
      operator: 'AND',
      conditions: [],
      responseType: opts.fallback
    };
    return JSON.stringify({ version: '1', rules: [reclash, fallback] }, null, 2);
  }

  /* The same header set for the panel's global "Response Headers", where the
     rwEncodeBase64: transform is available — so non-ASCII goes as readable
     text rather than as our own base64: payload. */
  function rwHeadersBlock(headers) {
    var set = rwHeaderSet(headers);
    if (!set.length) return '';
    return set.map(function (h) {
      var v = h[1];
      if (v.indexOf('base64:') === 0) return h[0] + ': rwEncodeBase64:' + b64decode(v.slice(7));
      return h[0] + ': ' + v;
    }).join('\n');
  }

  /* A LocalizedText is an object whose keys are all two-letter codes mapping
     to strings — that lets the walker narrow only real translations and leave
     branding URLs and config flags untouched. */
  function isLocalized(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    var ks = Object.keys(o);
    if (!ks.length) return false;
    return ks.every(function (k) { return /^[a-z]{2}$/.test(k) && typeof o[k] === 'string'; });
  }

  function narrowLocales(node, locales) {
    if (Array.isArray(node)) { node.forEach(function (x) { narrowLocales(x, locales); }); return; }
    if (!node || typeof node !== 'object') return;
    Object.keys(node).forEach(function (k) {
      var v = node[k];
      if (isLocalized(v)) {
        var picked = {};
        locales.forEach(function (l) { picked[l] = v[l] !== undefined ? v[l] : (v.en || v[Object.keys(v)[0]]); });
        node[k] = picked;
      } else {
        narrowLocales(v, locales);
      }
    });
  }

  /* Subscription-page config: the shipped ReClash template with the provider's
     branding folded in and every translation narrowed to the chosen locales,
     so the saved config never declares a locale it cannot fill. */
  function subpageBlock(opts, preview) {
    if (!RWTPL) return '';
    var cfg = JSON.parse(JSON.stringify(RWTPL));
    cfg.locales = opts.locales.slice();
    var title = preview.name || cfg.brandingSettings.title;
    cfg.brandingSettings.title = title;
    cfg.brandingSettings.logoUrl = preview.logo || '';
    cfg.brandingSettings.supportUrl = preview.support || '';
    cfg.baseSettings.metaTitle = title;
    narrowLocales(cfg, opts.locales);
    return JSON.stringify(cfg, null, 2);
  }

  /* The panel can't be probed from the browser — fetch cannot set User-Agent
     and cross-origin reads are blocked — so the check is a copy-paste curl the
     provider runs themselves: expect 200, a mihomo YAML body, and the
     Subscription-Userinfo the panel adds. */
  function curlBlock(opts) {
    var url = opts.suburl || 'https://panel.example.com/api/sub/<id>';
    var q = "'" + url.replace(/'/g, "'\\''") + "'";
    return [
      '# Expect: 200, Content-Type application/yaml, Subscription-Userinfo, ReClash-* headers.',
      '# FlClashX compatibility user-agent (the ReClash default):',
      "curl -sS -D - -o /dev/null -A 'FlClashX/v0.4.2' " + q,
      '',
      '# Native ReClash user-agent:',
      "curl -sS -D - -o /dev/null -A 'ReClash/1.0' " + q
    ].join('\n');
  }

  /* ------------------------------------------------------------- preview */

  function bytes(gb) {
    if (gb >= 1024) return (gb / 1024).toFixed(2) + ' TB';
    if (gb >= 1) return gb.toFixed(gb < 10 ? 2 : 1) + ' GB';
    return (gb * 1024).toFixed(0) + ' MB';
  }

  var screenEl = document.getElementById('pv-screen');
  var phoneEl = document.getElementById('pv-phone');

  function iconFor(kind, cls) {
    /* One glyph per Material icon the dashboard actually names, drawn rather
       than fetched: the icon on a tile head is the fastest way to recognise
       which widget you are looking at, so a rough stand-in would cost more
       than it saves. The comment after each is the icon it stands for. */
    var paths = {
      speed: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17 16 11"/><circle cx="12" cy="17" r="1.4"/>',
      route: '<path d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6"/><circle cx="6" cy="3" r="2"/><circle cx="18" cy="21" r="2"/>',
      /* call_split_sharp */
      split: '<path d="M12 20.5V14"/><path d="M12 14 7 9V5"/><path d="M12 14l5-5V5"/>' +
        '<path d="M4.5 7.5 7 5l2.5 2.5"/><path d="M14.5 7.5 17 5l2.5 2.5"/>',
      /* data_saver_off */
      donut: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.6"/><path d="M12 3.5v4.9"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
      power: '<path d="M12 3v9"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
      /* memory_rounded */
      chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
      /* devices */
      devices: '<rect x="2.5" y="5.5" width="12" height="8.5" rx="1.6"/><path d="M2 17.5h12.5"/>' +
        '<rect x="16.5" y="9" width="5" height="9" rx="1.4"/>',
      /* event_available_rounded */
      cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>' +
        '<path d="m9 15 2.2 2.2L15.6 13"/>',
      /* sync */
      sync: '<path d="M19.6 11a7.6 7.6 0 0 0-13.1-4.4L4.4 8.7"/><path d="M4.4 13a7.6 7.6 0 0 0 13.1 4.4l2.1-2.1"/>' +
        '<path d="M4.4 4.6v4.1h4.1M19.6 19.4v-4.1h-4.1"/>',
      /* stacked_line_chart */
      stack: '<path d="m3 15.5 5.5-5.5 3.5 3.5L20.5 5"/><path d="m3 20 5.5-5.5L12 18l8.5-8.5"/>',
      /* shuffle */
      shuffle: '<path d="M3.5 6.5H7l10 11h3.5"/><path d="M3.5 17.5H7l3.2-3.6M13.8 9.6 17 6.5h3.5"/>' +
        '<path d="m18 3.5 3 3-3 3M18 14.5l3 3-3 3"/>',
      /* alt_route_rounded */
      altroute: '<path d="M7.5 21v-6.5a5 5 0 0 1 5-5h4"/><path d="M7.5 3.5v6"/>' +
        '<path d="M5 6l2.5-2.5L10 6"/><path d="m14 7 2.5 2.5L14 12"/>',
      swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
      shield: '<path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z"/>',
      campaign: '<path d="M4 10v4h3l6 4V6l-6 4z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
      expand: '<path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/>',
      external: '<path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
      dns: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
      chevron: '<path d="m9 6 6 6-6 6"/>',
      /* bolt_rounded */
      bolt: '<path d="M13.2 2.6 5 13.8h5.9l-.9 7.6 8.2-11.2h-6z"/>'
    };
    return '<svg' + (cls ? ' class="' + cls + '"' : '') +
      ' viewBox="0 0 24 24" aria-hidden="true">' + (paths[kind] || paths.info) + '</svg>';
  }

  /* The four routing modes, in the enum's order — UiOutboundMode
     { auto, rule, global, direct }. Both mode widgets list all four. */
  var MODES = [s('modeAuto'), s('modeRule'), s('modeGlobal'), s('modeDirect')];

  /* _TrafficDataItem: a coloured arrow, the figure, and the unit pushed to
     the far end of the row on its own. */
  function tflow(dir, n) {
    var parts = bytes(n).split(' ');
    return '<div class="tflow"><i class="tflow__a tflow__a--' + dir + '">' +
      (dir === 'up' ? '&#8593;' : '&#8595;') + '</i>' +
      '<span class="tflow__v">' + parts[0] + '</span>' +
      '<b>' + (parts[1] || '') + '</b></div>';
  }

  /* network_speed.dart hands the whole card below the head to a LineChart
     with gradient: true, bled to both edges. A preview has no traffic to
     plot, so it gets one frozen frame of a plausible minute. */
  var SPARK = '<svg class="spark__c" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">' +
    '<defs><linearGradient id="pv-spark" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="currentColor" stop-opacity=".38"/>' +
    '<stop offset="1" stop-color="currentColor" stop-opacity="0"/>' +
    '</linearGradient></defs>' +
    '<path class="spark__f" d="M0 33 L10 29 L20 31 L30 19 L40 23 L50 11 L60 15 L70 5 L80 12 L90 8 L100 18 L110 13 L120 20 V40 H0 Z"/>' +
    '<path class="spark__l" d="M0 33 L10 29 L20 31 L30 19 L40 23 L50 11 L60 15 L70 5 L80 12 L90 8 L100 18 L110 13 L120 20"/>' +
    '</svg>';

  /* The NL tricolour as three bands of a disc — the client pulls a flag image
     per country, which a site with no CDN and no third-party requests cannot,
     so the one country the sample data names is drawn instead. */
  function flagDisc(cls) {
    return '<span class="hflag ' + cls + '" aria-hidden="true"><span class="hflag__d"></span></span>';
  }

  /* DashboardInfoCard's head: a 20px leading glyph in onSurfaceVariant, 8px,
     the label on one line, and — when the tile has somewhere to go — an
     action pinned to the far end. `lead` is markup rather than an icon name
     because network_detection.dart puts a flag where the icon would be. */
  function headRow(lead, label, action) {
    return '<div class="tile__head">' + lead + '<span>' + esc(label) + '</span>' +
      (action || '') + '</div>';
  }

  /* Two of the application's own layout facts, carried over verbatim:
     widget_registry.dart gives every widget 4 or 8 of the handset's 8 grid
     columns, and each widget sizes itself with getWidgetHeight(1 | 2). `wide`
     is the first, `tall` the second; the CSS turns them into column and row
     spans over the same 80px row and 14px gutter the client uses. */
  function tile(inner, head, icon, wide, tall, action) {
    return '<div class="tile' + (wide ? ' tile--wide' : '') + (tall ? ' tile--tall' : '') + '">' +
      (head ? headRow(iconFor(icon), head, action) : '') + inner + '</div>';
  }

  /* Announce is a DashboardInfoCard like any other tile — campaign icon, the
     word "Объявление", an expand affordance — not the tinted callout the
     desktop mock used to paint. */
  function announceTile(text) {
    return tile('<p class="tile__body">' + esc(text) + '</p>',
      s('wAnnounce'), 'campaign', true, true, iconFor('expand'));
  }

  /* quick_options.dart builds the TUN, VPN and system-proxy tiles from one
     _QuickSwitchCard: the head, the word "Опции", and the switch itself. */
  function quickTile(label, icon) {
    return tile('<div class="quick"><span>' + esc(s('options')) + '</span>' +
      '<i class="swi" aria-hidden="true"></i></div>', label, icon);
  }

  /* meta_info.dart is the subscription card, not the core's version string:
     the profile's own label, how long it has left, the traffic figure with
     its caption — or the buy offers in the caption's place — and the quota
     bar underneath when the plan has a quota at all. */
  function metaTile(p) {
    var used = p.up + p.down;
    var hasQuota = p.userinfo && p.total > 0;
    var days = daysLeft(p.expire);
    var status = p.expire
      ? s('metaDays').replace('{n}', days).replace('{D}', plural('plDays', days))
      : s('metaPerpetual');

    var value = p.userinfo
      ? (hasQuota ? bytes(Math.max(0, p.total - used)) + ' / ' + bytes(p.total) : bytes(used))
      : '—';
    var caption = '<span class="meta__cap">' +
      esc(hasQuota || !p.userinfo ? s('metaRemaining') : s('metaUsed')) + '</span>';

    /* The caption only names the number beside it; an offer that is live
       right now is worth more than the repetition — the client's own
       reasoning, and its own two chips. */
    var chips = '';
    if (p.buyPlan) chips += '<span class="hbuy">' + hIcon('renew') + esc(s('heroRenew')) + '</span>';
    if (p.buyTraffic) chips += '<span class="hbuy">' + hIcon('cart') + esc(s('heroTopUp')) + '</span>';

    return tile(
      '<div class="meta__label">' + esc(p.title || p.name) + '</div>' +
      '<div class="meta__st">' + esc(status) + '</div>' +
      '<div class="meta__row">' + (chips ? '<div class="hbuys">' + chips + '</div>' : caption) +
      '<b class="meta__v mono">' + esc(value) + '</b></div>' +
      (hasQuota
        ? '<div class="hbar"><i style="width:' +
          (Math.min(1, used / p.total) * 100).toFixed(1) + '%"></i></div>'
        : ''),
      s('wMeta'), 'cal', true, true, iconFor('sync'));
  }

  function renderWidget(id, p) {
    switch (id) {
      /* The head carries the current speed at its far end, and everything
         below it is chart, bled to the card's edges. */
      case 'networkSpeed':
        return tile('<div class="spark" aria-hidden="true">' + SPARK + '</div>',
          s('wNetworkSpeed'), 'speed', true, true,
          '<span class="tile__now mono">18.4 MB/s</span>');
      /* The two routing widgets are not two skins of one thing. V2 is a
         full-width segmented bar with a coloured strip under it and no head
         at all; the legacy one is a half-width radio list. Both list the
         same four modes. */
      case 'outboundModeV2':
        return '<div class="tile tile--wide tile--seg">' +
          '<div class="segbar" role="tablist">' +
          MODES.map(function (label, i) {
            return '<button type="button" role="tab" aria-selected="' + (i === 0) + '">' +
              esc(label) + '</button>';
          }).join('') +
          '</div><span class="segbar__strip" aria-hidden="true"></span></div>';
      case 'outboundMode':
        return tile('<div class="modes">' +
          MODES.map(function (label, i) {
            return '<button type="button" aria-checked="' + (i === 0) + '"><span></span>' +
              esc(label) + '</button>';
          }).join('') +
          '</div>', s('wOutbound'), 'split', false, true);
      /* traffic_usage.dart is a donut of upload against download with a
         two-entry legend, then the same two figures spelled out. The quota
         bar belongs to the subscription tile, not here. */
      case 'trafficUsage':
        var tot = p.up + p.down;
        var upPct = tot > 0 ? (p.up / tot) * 100 : 50;
        /* _TrafficLegend hands back an empty box whenever its labels are wider
           than the room beside the chart, and in a half-width tile on a
           handset they always are — so the donut has the row to itself, the
           way the client actually draws it. The two arrows below carry the
           colour key instead. */
        return tile('<div class="donut">' +
          '<span class="donut__ring" style="--up:' + upPct.toFixed(1) + '%"></span></div>' +
          tflow('up', p.up) + tflow('down', p.down),
        s('wTraffic'), 'donut', false, true);
      /* network_detection.dart: the country of the exit address takes the
         icon's place (leading ?? Icon), and the body is one Row — the
         connection doctor's verdict, then the measured address in mono.
         The client's flag is an emoji in a bundled font; regional-indicator
         pairs render as bare letters on Windows, so the disc is drawn. */
      case 'networkDetection':
        return '<div class="tile">' +
          headRow(flagDisc('hflag--sm'), s('wDetect'), iconFor('chevron')) +
          '<div class="detect"><span class="detect__s">' + esc(s('detectOk')) + '</span>' +
          '<span class="detect__ip mono">' + HERO_NODE.ip + '</span></div></div>';
      case 'intranetIp':
        return tile('<div class="value mono">192.168.1.42</div>', s('wIntranet'), 'devices');
      case 'memoryInfo':
        return tile('<div class="value">96<small> MB</small></div>', s('wMemory'), 'chip');
      case 'metaInfo':
        return metaTile(p);
      case 'announce':
        return p.announce ? announceTile(p.announce) : '';
      /* service_info.dart: logo, service name, account — and the open-in-new
         affordance only when ReClash-SupportUrl gave it somewhere to go. */
      case 'serviceInfo':
        return '<div class="tile">' +
          headRow(iconFor('dns'), s('wService'), p.support ? iconFor('external') : '') +
          '<div class="service">' +
          /* The initial is the floor, not the alternative: a ReClash-ServiceLogo
             with a typo in it leaves the client showing its fallback, and the
             preview has to show the same thing rather than an empty square. */
          '<div class="service__logo">' + esc(p.name.slice(0, 1).toUpperCase()) +
          (p.logo ? '<img src="' + esc(p.logo) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '') +
          '</div>' +
          '<div style="min-width:0"><div class="service__name">' + esc(p.name) + '</div>' +
          '<div class="tile__sub">user-4821</div></div></div></div>';
      /* change_server_button.dart: the active node's flag, its name, its
         delay in the delay colour, and a chevron into the proxy page. */
      case 'changeServerButton':
        return '<div class="tile">' +
          headRow(iconFor('swap'), s('wChangeServer'), iconFor('chevron')) +
          '<div class="active">' + flagDisc('hflag--sm') +
          '<span class="active__n">' + esc(p.serverInfo) + '</span>' +
          '<span class="active__d mono">' + HERO_NODE.delay + ' ms</span></div></div>';
      /* smart_routing_card.dart calls heroServiceLineViewOf — the same
         function the hero's line calls — so the tile and the hero cannot
         describe one engine two ways. With the tunnel carrying traffic that
         is routingOn: bolt_rounded, smartRoutingOn, accented. */
      case 'smartRouting':
        return '<div class="tile">' +
          headRow(iconFor('altroute'), s('wSmart'), iconFor('chevron')) +
          '<div class="sline">' + iconFor('bolt', 'sline__i') +
          '<span class="sline__t">' + esc(s('heroSmart')) + '</span></div></div>';
      case 'tunButton':
        return quickTile('TUN', 'stack');
      case 'vpnButton':
        return quickTile('VPN', 'stack');
      case 'systemProxyButton':
        return quickTile(s('sysProxy'), 'shuffle');
      default:
        return '';
    }
  }

  var NODES = [
    { n: 'Amsterdam 01', f: 'NL', d: 42 }, { n: 'Frankfurt 02', f: 'DE', d: 58 },
    { n: 'Helsinki 01', f: 'FI', d: 36 }, { n: 'Warsaw 03', f: 'PL', d: 74 },
    { n: 'Stockholm 01', f: 'SE', d: 61 }, { n: 'Paris 02', f: 'FR', d: 88 }
  ];

  function renderProxyView(p) {
    var v = p.view;
    var pad = v.layout === 'tight' ? '.32rem .5rem' : v.layout === 'loose' ? '.75rem .8rem' : '.55rem .7rem';
    var list = NODES.slice();
    if (v.sort === 'delay') list.sort(function (a, b) { return a.d - b.d; });
    if (v.sort === 'name') list.sort(function (a, b) { return a.n.localeCompare(b.n); });

    var cols = v.type === 'list' || v.card === 'min' || v.card === 'oneline' ? 1 : 2;
    var body = list.map(function (nd, i) {
      var delay = '<span class="node__delay" data-q="' + (nd.d < 120 ? 'fast' : 'ok') + '">' + nd.d + ' ms</span>';
      var icon = v.icon === 'none' ? ''
        : '<span class="node__flag">' + esc(nd.f) + '</span>';
      if (v.card === 'min' || v.card === 'oneline') {
        return '<div class="node" style="padding:' + pad + ';display:flex;align-items:center;gap:.5rem"' +
          (i === 0 ? ' aria-checked="true"' : '') + '>' +
          '<span class="node__name" style="flex:1 1 auto">' + esc(nd.n) + '</span>' + icon + delay + '</div>';
      }
      return '<div class="node" style="padding:' + pad + '"' + (i === 0 ? ' aria-checked="true"' : '') + '>' +
        '<div class="node__name">' + esc(nd.n) + '</div>' +
        '<div class="node__meta">' + icon + delay + '</div></div>';
    }).join('');

    var tabsHtml = v.type === 'tab'
      ? '<div class="grouptabs"><button type="button" aria-selected="true">' + esc(s('grpAuto')) +
        '</button><button type="button">' + esc(p.serverInfo) + '</button><button type="button">' +
        esc(s('grpStreaming')) + '</button></div>'
      : '<div class="tile__head" style="margin:0 0 .4rem">' + iconFor('route') + '<span>' + esc(p.serverInfo) + '</span></div>';

    return tabsHtml + '<div class="nodes" style="grid-template-columns:repeat(' + cols +
      ',minmax(0,1fr));max-height:none;overflow:visible">' + body + '</div>';
  }

  /* ---------------------------------------------- the connection screen
     A near-copy of lib/views/dashboard/widgets/hero_connect.dart: orb,
     caption, server card, subscription strip, action row, page affordance.
     Every piece is driven by a field in the form, so the provider watches the
     screen they are actually configuring instead of a generic VPN mock-up. */

  /* hero_status.dart: the ring defaults to cyan -> blue -> violet, harmonised
     towards the scheme's primary. Material's Blend.harmonize rotates a hue
     towards the source by at most 15 degrees, which is what harmonize() does. */
  var HERO_RING = ['#10EDF8', '#2A8BFD', '#6C58FC'];

  function harmonize(hexStr, targetHue) {
    var c = rgbToHsl.apply(null, hexToRgb(hexStr));
    var diff = ((targetHue - c[0] + 540) % 360) - 180;
    var step = Math.min(Math.abs(diff) * 0.5, 15);
    return hsl(c[0] + (diff < 0 ? -step : step), c[1], c[2]);
  }

  function ringOf(p, accentHue) {
    var ok = p.ring && p.ring.every(function (c) { return /^#?[0-9A-Fa-f]{6,8}$/.test(c); });
    /* AARRGGBB arrives alpha first, and the gradient wants the colour: the
       last six digits are the same six the client reads. */
    if (ok) return p.ring.map(function (c) { return '#' + c.replace('#', '').slice(-6); });
    return HERO_RING.map(function (c) { return harmonize(c, accentHue); });
  }

  function daysLeft(expire) {
    if (!expire) return 0;
    var ts = new Date(expire + 'T00:00:00Z').getTime();
    if (isNaN(ts)) return 0;
    return Math.max(0, Math.ceil((ts - Date.now()) / 86400000));
  }

  /* getDelayColor() and the subscription bar's two thresholds, in the same
     order the client applies them. */
  function delayColor(ms, accent) {
    if (ms < 100) return '#39d98a';
    if (ms < 200) return accent;
    if (ms < 400) return '#ffc93c';
    return '#f2555a';
  }

  var H_PATH = {
    route: '<path d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6"/><circle cx="6" cy="3" r="2"/><circle cx="18" cy="21" r="2"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    cal: '<rect x="3.5" y="5.5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 11h17"/>',
    camp: '<path d="M4 10v4l12 4.5V5.5z"/><path d="M16.5 9.5a3 3 0 0 1 0 5"/><path d="M7 14.8V20"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.5 3.5V9h-5.5"/>',
    renew: '<path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5"/><path d="M19.5 12a7.5 7.5 0 0 1-12.6 5.5"/><path d="M17.5 2.5v4.5h-4.5M6.5 21.5V17h4.5"/>',
    cart: '<circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/><path d="M2.5 4h2.2l2.4 10.2a1.8 1.8 0 0 0 1.8 1.4h8.3a1.8 1.8 0 0 0 1.8-1.4L21 7.5H6"/>',
    support: '<path d="M5 13.5a7 7 0 0 1 14 0"/><rect x="2.5" y="13" width="4" height="6.5" rx="1.7"/><rect x="17.5" y="13" width="4" height="6.5" rx="1.7"/><path d="M19.5 19.5a3 3 0 0 1-3 3h-2.2"/>',
    pause: '<path d="M9.2 5v14M14.8 5v14"/>',
    bolt: '<path d="M13.2 2.6 5 13.8h5.9l-.9 7.6 8.2-11.2h-6z"/>',
    /* The orb speed pair: south for download, north for upload. */
    sdown: '<path d="M12 4.5v15M6 13.5l6 6 6-6"/>',
    sup: '<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>',
    /* The provider card's cloud fallback (no serviceLogo) and the system
       card's memory section title. */
    cloud: '<path d="M7 18.5a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6-1.03A3.75 3.75 0 0 1 17 18.5z"/>',
    mem: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.6"/>'
      + '<path d="M9 6V3.5M12 6V3.5M15 6V3.5M9 20.5V18M12 20.5V18M15 20.5V18M6 9H3.5M6 12H3.5M6 15H3.5M20.5 9H18M20.5 12H18M20.5 15H18"/>'
  };

  function hIcon(k, cls) {
    return '<svg class="hico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' +
      (H_PATH[k] || '') + '</svg>';
  }

  /* The three strokes of the mark, mono — what the orb shows when the provider
     has not sent a logo (hero_orb.dart falls back to mark_mono.png). */
  var APP_MARK = '<svg class="horb__mark" viewBox="0 0 512 512" aria-hidden="true">' +
    '<g fill="none" stroke="currentColor" stroke-width="62.1" stroke-linecap="round">' +
    '<path d="M137.3 225.8 184.5 355.5"/><path d="M208.8 126.3 303.2 385.7"/>' +
    '<path d="M335.3 178.1 366.7 264.6"/></g></svg>';

  /* One sample node, the way the screenshot has it: a stack of three servers
     under one flag, 42 ms away. */
  var HERO_NODE = { ip: '185.146.173.42', delay: 42, stack: 2 };

  function heroOrb(p, ring) {
    return '<div class="horb' + (p.heroEffect ? ' horb--aurora' : '') +
      '" style="--r1:' + ring[0] + ';--r2:' + ring[1] + ';--r3:' + ring[2] + '">' +
      (p.heroEffect ? '<span class="horb__aurora" aria-hidden="true"></span>' : '') +
      '<span class="horb__glow" aria-hidden="true"></span>' +
      '<span class="horb__rim" aria-hidden="true"></span>' +
      /* The client paints mark_mono.png in the core when there is no logo —
         and also when the one it was given will not load, which is what a
         typo in ReClash-ServiceLogo looks like from the outside. Both are in
         the markup, the image on top, and it takes itself out on error. */
      '<span class="horb__core">' + APP_MARK +
      (p.logo
        ? '<img class="horb__logo" src="' + esc(p.logo) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">'
        : '') +
      '</span></div>';
  }

  function heroServer(p, sc) {
    var d = HERO_NODE.delay;
    var lvl = d < 150 ? 4 : d < 300 ? 3 : d < 600 ? 2 : 1;
    var bars = '';
    for (var i = 1; i <= 4; i++) bars += '<i' + (i <= lvl ? ' data-on="true"' : '') + '></i>';
    return '<div class="hcard">' +
      '<div class="hsrv">' +
      '<span class="hflag"><i></i><i></i><span class="hflag__d"></span>' +
      '<span class="hflag__n mono">+' + HERO_NODE.stack + '</span></span>' +
      '<span class="hsrv__id"><b>' + esc(p.serverInfo) + '</b>' +
      '<span class="hsrv__ip mono">' + HERO_NODE.ip + '</span></span>' +
      '<span class="hsrv__sig"><span class="hbars">' + bars + '</span>' +
      '<span class="hsrv__ms mono" style="color:' + delayColor(d, sc.accent) + '">' + d + ' ms</span></span>' +
      hIcon('chev', 'hico--chev') +
      '</div>' +
      '<div class="hcard__div"></div>' +
      '<div class="hsvc hsvc--on">' + hIcon('bolt') + '<span>' + esc(s('heroSmart')) + '</span></div>' +
      '</div>';
  }

  function heroSubCard(p, sc) {
    var used = p.up + p.down;
    var prog = p.total > 0 ? Math.min(1, used / p.total) : 0;
    var barCol = prog > 0.9 ? '#f2555a' : prog > 0.7 ? '#c57f0a' : sc.accent;
    var days = daysLeft(p.expire);

    var cap = '<span class="hsub__cap">' + esc(s('heroSub')) + '</span>';
    if (p.expire) {
      cap += '<span class="hpill" style="--pc:' + (days <= 3 ? '#f2555a' : sc.accent) + '">' +
        hIcon('cal') + esc(s('heroRemaining')) + ' ' + days + ' ' + esc(plural('plDays', days)) +
        '</span>';
    }

    var num = p.total > 0
      ? '<b class="mono">' + bytes(Math.max(0, p.total - used)) + '</b> <span>' +
        esc(s('heroFree').replace('{n}', bytes(p.total))) + '</span>'
      : '<b class="mono">' + bytes(used) + '</b> <span>' + esc(s('heroUnlimited')) + '</span>';

    var chips = '';
    if (p.buyPlan) chips += '<span class="hbuy">' + hIcon('renew') + esc(s('heroRenew')) + '</span>';
    if (p.buyTraffic) chips += '<span class="hbuy">' + hIcon('cart') + esc(s('heroTopUp')) + '</span>';

    return '<div class="hcard hcard--sub">' +
      '<div class="hsub__top"><span class="hsub__caps">' + cap + '</span>' +
      (p.announce ? hIcon('camp', 'hico--accent') : '') + hIcon('chev', 'hico--chev') + '</div>' +
      '<p class="hsub__num">' + num + '</p>' +
      (p.total > 0
        ? '<div class="hbar"><i style="width:' + (prog * 100).toFixed(1) +
          '%;--bc:' + barCol + '"></i></div>'
        : '') +
      (chips ? '<div class="hbuys">' + chips + '</div>' : '') +
      '</div>';
  }

  function heroActions(p) {
    var acts = '<span class="hact">' + hIcon('refresh') + '<span>' + esc(s('heroUpdate')) + '</span></span>';
    if (p.support) {
      acts += '<span class="hact">' + hIcon('support') + '<span>' + esc(s('support')) + '</span></span>';
    }
    acts += '<span class="hact hact--sq" title="' + esc(s('heroPause')) + '">' + hIcon('pause') + '</span>';
    acts += '<span class="hact hact--sq" title="' + esc(s('wOutbound')) + '">' + hIcon('route') + '</span>';
    return '<div class="hacts">' + acts + '</div>';
  }

  /* The download/upload readout under the caption once connected — a centred
     pair of arrow + monospace value + unit, exactly the _SpeedEntry row in
     hero_connect_orb_slot.dart. */
  function heroSpeed() {
    function entry(icon, val) {
      return '<span class="hspeed__e">' + hIcon(icon) +
        '<b class="mono">' + esc(val) + '</b>' +
        '<span class="hspeed__u">' + esc(s('heroSpeedUnit')) + '</span></span>';
    }
    return '<div class="hspeed">' +
      entry('sdown', s('heroDownVal')) + entry('sup', s('heroUpVal')) + '</div>';
  }


  function renderHero(p, sc) {
    /* hasSub in hero_connect.dart: no quota and no expiry means there is
       nothing to put in the strip, and an announcement takes its place. */
    var hasSub = p.userinfo && (p.total > 0 || !!p.expire);
    return '<div class="hero">' +
      heroOrb(p, ringOf(p, sc.hue)) +
      '<div class="hcap">' +
      '<p class="hcap__t">' + esc(p.activeText || s('heroProtected')) + '</p>' +
      '<p class="hcap__s">' + esc(s('heroSince').replace('{n}', s('heroDur'))) + '</p>' +
      heroSpeed() +
      '</div>' +
      heroServer(p, sc) +
      (hasSub
        ? heroSubCard(p, sc)
        : p.announce
          ? '<div class="hcard hnote">' + hIcon('camp', 'hico--accent') +
            '<span>' + esc(p.announce) + '</span>' + hIcon('chev', 'hico--chev') + '</div>'
          : '') +
      heroActions(p) +
      '<div class="hmore">' + hIcon('down') + '<span>' + esc(s('heroMore')) + '</span></div>' +
      '</div>';
  }

  /* -------------------------------------------------------- preview shell */

  var pvMode = 'hero';
  var titleEl = document.getElementById('pv-title');
  var titleDash = titleEl ? titleEl.textContent : '';

  /* Guards background loads: a fetch that resolves after the URL changed
     must not overwrite the current one. Bumped on every bg (re)apply. */
  var bgToken = 0;

  function renderPreview(p) {
    if (!screenEl || !phoneEl) return;
    var sc = scheme('#' + p.hex, p.theme ? p.variant : 'tonalspot', p.theme && p.pureblack);
    if (!p.theme) sc = scheme('#7C5CFF', 'tonalspot', false);

    phoneEl.style.setProperty('--accent', sc.accent);
    phoneEl.style.setProperty('--accent-2', sc.accent2);
    phoneEl.style.setProperty('--app-bg', sc.bg);
    phoneEl.style.setProperty('--app-surface', sc.surface);
    phoneEl.style.setProperty('--app-surface-2', sc.surface2);
    phoneEl.style.setProperty('--app-line', sc.line);
    phoneEl.style.setProperty('--app-text', sc.text);
    phoneEl.style.setProperty('--app-dim', sc.dim);
    phoneEl.setAttribute('data-screen', pvMode);

    var bgEl = document.getElementById('pv-bg');
    if (bgEl) {
      if (p.bg) {
        /* The background art is the one thing in the preview that reaches out
           to a host the provider typed. On the blocked or throttled networks
           this audience lives on, a dead host would otherwise pin the tab's
           loading indicator for the browser's full image timeout — which is
           exactly the "#cfg= link takes forever to load" report. So fetch it
           out of band: paint it only once it actually decodes, drop it on
           error or after 6s, and ignore a load that resolves after the URL
           has already changed. A missing image just leaves the flat scheme. */
        var url = p.bg.replace(/"/g, '');
        var op = String(Math.max(1, Math.min(100, p.bgOpacity)) / 100);
        var token = ++bgToken;
        bgEl.style.backgroundImage = '';
        bgEl.style.opacity = '0';
        var img = new Image();
        var settled = false;
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          img.onload = img.onerror = null;
          img.src = '';
        }, 6000);
        img.onload = function () {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (token !== bgToken) return;
          bgEl.style.backgroundImage = 'url("' + url + '")';
          bgEl.style.opacity = op;
        };
        img.onerror = function () { settled = true; clearTimeout(timer); };
        img.src = url;
      } else {
        bgToken++;
        bgEl.style.backgroundImage = '';
        bgEl.style.opacity = '0';
      }
    }

    /* The widget screen keeps the floating connect button; the connection
       screen has the orb instead, and CSS hides the button there. Both take
       the ring from the same place. */
    var fabEl = document.getElementById('pv-fab');
    if (fabEl) {
      var r = fabEl.querySelector('.fab__ring');
      var ring = ringOf(p, sc.hue);
      if (r) {
        r.style.setProperty('--ring-a', ring[0]);
        r.style.setProperty('--ring-b', ring[1]);
        r.style.setProperty('--ring-c', ring[2]);
        r.style.opacity = '1';
      }
    }

    if (titleEl) titleEl.textContent = pvMode === 'proxy' ? s('proxies') : titleDash;

    if (pvMode === 'proxy') {
      screenEl.innerHTML = renderProxyView(p);
      return;
    }
    if (pvMode === 'hero') {
      screenEl.innerHTML = renderHero(p, sc);
      return;
    }

    var body = p.widgets.map(function (id) { return renderWidget(id, p); }).join('');
    if (p.announce && p.widgets.indexOf('announce') === -1) {
      body = announceTile(p.announce) + body;
    }
    screenEl.innerHTML = '<div class="appgrid">' +
      (body || '<div class="tile"><div class="tile__sub">' + esc(s('noWidgets')) + '</div></div>') +
      '</div>';
  }

  $$('[data-pv]').forEach(function (b) {
    b.addEventListener('click', function () {
      pvMode = b.getAttribute('data-pv');
      $$('[data-pv]').forEach(function (x) {
        x.setAttribute('aria-selected', x === b ? 'true' : 'false');
      });
      update();
    });
  });

  /* ---------------------------------------------------------------- glue */

  var warnBox = document.getElementById('builder-warnings');
  var outputs = {
    srr: document.getElementById('out-srr'),
    rwh: document.getElementById('out-rwh'),
    subpage: document.getElementById('out-subpage'),
    curl: document.getElementById('out-curl'),
    http: document.getElementById('out-http'),
    nginx: document.getElementById('out-nginx'),
    caddy: document.getElementById('out-caddy'),
    php: document.getElementById('out-php'),
    go: document.getElementById('out-go'),
    py: document.getElementById('out-py')
  };
  var counter = document.getElementById('builder-count');

  function update() {
    var res = collect();
    var h = res.headers;

    /* Remnawave artefacts stay valid even with no headers: SRR always needs
       its ReClash rule plus the catch-all, the page is a full template, and
       the check is a command — so these render unconditionally. */
    var rw = rwOpts();
    if (outputs.srr) outputs.srr.textContent = srrBlock(h, rw);
    if (outputs.rwh) outputs.rwh.textContent = rwHeadersBlock(h);
    if (outputs.subpage) outputs.subpage.textContent = subpageBlock(rw, res.preview);
    if (outputs.curl) outputs.curl.textContent = curlBlock(rw);

    if (outputs.http) outputs.http.textContent = httpBlock(h, res.userinfo);
    if (outputs.nginx) outputs.nginx.textContent = h.length ? nginxBlock(h, res.userinfo) : '';
    if (outputs.caddy) outputs.caddy.textContent = h.length ? caddyBlock(h, res.userinfo) : '';
    if (outputs.php) outputs.php.textContent = h.length ? phpBlock(h, res.userinfo) : '';
    if (outputs.go) outputs.go.textContent = h.length ? goBlock(h, res.userinfo) : '';
    if (outputs.py) outputs.py.textContent = h.length ? pyBlock(h, res.userinfo) : '';

    if (counter) {
      var size = h.reduce(function (a, x) { return a + x[0].length + x[1].length + 4; }, 0);
      counter.textContent = s('countLabel')
        .replace('{n}', h.length).replace('{H}', plural('plHeaders', h.length))
        .replace('{b}', size).replace('{B}', plural('plBytes', size));
    }

    if (warnBox) {
      warnBox.innerHTML = res.warnings.map(function (w) {
        return '<p class="warnline' + (w.hard ? ' warnline--err' : '') + '">' +
          '<span aria-hidden="true">' + (w.hard ? '!' : '?') + '</span><span>' + esc(w.text) + '</span></p>';
      }).join('');
    }

    renderPreview(res.preview);
    markActiveGroups();
    scheduleHash();
  }

  /* A burst of `input` events — a held key, a paste, a drag on a range —
     collapses to one render per animation frame instead of one per event.
     Direct callers (presets, undo, view toggle) still hit update() straight
     away, so a click stays instant; only the keystroke path is coalesced. */
  var frame = 0;
  function queueUpdate() {
    if (frame) return;
    frame = requestAnimationFrame(function () { frame = 0; update(); });
  }

  /* history.replaceState with a full-form JSON+base64 payload is the most
     expensive thing per keystroke and the least urgent: the link only has to
     be right once typing settles. Debounced off the hot path. */
  var hashTimer = 0;
  function scheduleHash() {
    if (hashTimer) clearTimeout(hashTimer);
    hashTimer = setTimeout(function () { hashTimer = 0; syncHash(); }, 300);
  }

  /* A block wears its accent rail and live dot when it is actually doing
     something: a checkbox switched on, or a text/URL field filled. Number and
     date fields are excluded — they live only in block 01, whose master
     checkbox already governs whether any of them are emitted, so an unchecked
     block with its default 12.5 in the boxes must still read as off. */
  var groups = $$('[data-group]', form);
  function markActiveGroups() {
    groups.forEach(function (g) {
      var live = false;
      $$('input, textarea', g).forEach(function (el) {
        if (live) return;
        if (el.type === 'checkbox') { if (el.checked) live = true; return; }
        if (el.type === 'text' || el.type === 'url' || el.tagName === 'TEXTAREA') {
          if (el.value.trim()) live = true;
        }
      });
      g.setAttribute('data-active', live ? 'true' : 'false');
    });
  }

  /* Accordion: one block open at a time, and the switch is animated on both
     sides — the grid row of each block eases between 0fr and 1fr in CSS, so
     opening one while another closes reads as a single glide, not a snap. JS
     only flips data-open and aria-expanded; the CSS does the motion. Without
     JS every block stays open (see the .no-js rule), so nothing is trapped. */
  function setOpen(g, open) {
    g.setAttribute('data-open', open ? 'true' : 'false');
    var btn = $('.bgroup__sum', g);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  groups.forEach(function (g) {
    var btn = $('.bgroup__sum', g);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var willOpen = g.getAttribute('data-open') !== 'true';
      if (willOpen) {
        groups.forEach(function (other) {
          if (other !== g) setOpen(other, false);
        });
      }
      setOpen(g, willOpen);
    });
  });

  /* shareable configuration link */
  var hashLock = false;
  function syncHash() {
    if (hashLock) return;
    var data = {};
    $$('input, select, textarea', form).forEach(function (el) {
      if (!el.id && !el.hasAttribute('data-setting')) return;
      var key = el.id || 'set:' + el.getAttribute('data-setting');
      data[key] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
    });
    data.__order = order.join(',');
    data.__w = order.filter(function (i) { return enabled[i]; }).join(',');
    try {
      history.replaceState(null, '', '#cfg=' + b64(JSON.stringify(data)).replace(/=+$/, ''));
    } catch (e) {}
  }

  function loadHash() {
    var m = /#cfg=([A-Za-z0-9+/=]+)/.exec(location.hash);
    if (!m) return false;
    try {
      var pad = m[1] + '==='.slice((m[1].length + 3) % 4);
      var bin = atob(pad);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var data = JSON.parse(new TextDecoder().decode(arr));
      hashLock = true;
      Object.keys(data).forEach(function (k) {
        if (k.indexOf('__') === 0) return;
        var el = k.indexOf('set:') === 0
          ? form.querySelector('[data-setting="' + k.slice(4) + '"]')
          : document.getElementById(k);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!data[k];
        else el.value = data[k];
      });
      if (data.__order) {
        var incoming = data.__order.split(',').filter(function (id) {
          return WIDGETS.some(function (w) { return w.id === id; });
        });
        order.forEach(function (id) { if (incoming.indexOf(id) === -1) incoming.push(id); });
        order = incoming;
      }
      if (data.__w !== undefined) {
        var onList = data.__w ? data.__w.split(',') : [];
        Object.keys(enabled).forEach(function (id) { enabled[id] = onList.indexOf(id) !== -1; });
      }
      hashLock = false;
      return true;
    } catch (e) { hashLock = false; return false; }
  }

  /* presets

     A preset overwrites every field at once, including whatever the provider
     had already typed in. Asking first would mean a confirm() on the happy
     path too, so instead the previous state is kept and the button next to the
     presets turns into an undo for as long as it is useful. */
  var undoBtn = document.getElementById('builder-undo');
  var snapshot = null;

  function snap() {
    var data = {};
    $$('input, select, textarea', form).forEach(function (el) {
      if (!el.id && !el.hasAttribute('data-setting')) return;
      var key = el.id || 'set:' + el.getAttribute('data-setting');
      data[key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return { fields: data, order: order.slice(), enabled: JSON.parse(JSON.stringify(enabled)) };
  }

  function applySnap(st) {
    Object.keys(st.fields).forEach(function (k) {
      var el = k.indexOf('set:') === 0
        ? form.querySelector('[data-setting="' + k.slice(4) + '"]')
        : document.getElementById(k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!st.fields[k];
      else el.value = st.fields[k];
    });
    order = st.order.slice();
    Object.keys(enabled).forEach(function (id) { enabled[id] = !!st.enabled[id]; });
  }

  function showUndo(name) {
    if (!undoBtn) return;
    undoBtn.hidden = false;
    undoBtn.textContent = s('undo');
    undoBtn.setAttribute('title', s('undoHint').replace('{n}', name));
  }

  $$('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.getAttribute('data-preset');
      var preset = (S.presets || {})[kind];
      if (!preset) return;
      snapshot = snap();
      Object.keys(preset).forEach(function (k) {
        if (k === 'widgets') {
          Object.keys(enabled).forEach(function (id) { enabled[id] = preset.widgets.indexOf(id) !== -1; });
          var head = preset.widgets.slice();
          order.forEach(function (id) { if (head.indexOf(id) === -1) head.push(id); });
          order = head;
          return;
        }
        var el = document.getElementById(k);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!preset[k];
        else el.value = preset[k];
      });
      renderWidgetList();
      update();
      showUndo(b.textContent.trim());
      form.scrollIntoView({ behavior: RC.reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  if (undoBtn) {
    undoBtn.addEventListener('click', function () {
      if (!snapshot) return;
      applySnap(snapshot);
      snapshot = null;
      undoBtn.hidden = true;
      renderWidgetList();
      update();
    });
  }

  var shareBtn = document.getElementById('builder-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      RC.copyText(location.href).then(function () {
        var t = shareBtn.textContent;
        shareBtn.textContent = s('linkCopied');
        setTimeout(function () { shareBtn.textContent = t; }, 1700);
      });
    });
  }

  form.addEventListener('input', queueUpdate);
  form.addEventListener('change', queueUpdate);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  loadHash();
  renderWidgetList();
  update();
})();
