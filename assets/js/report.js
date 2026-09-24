/* Subscription-report decoder. The report rides in the URL fragment; this
   file unpacks it (R1 = gzip + base64url) and paints it, entirely client-side.
   Strings come from #report-strings so nothing is hard-coded per language, and
   every value is escaped through textContent — never innerHTML from data. */
(function () {
  'use strict';

  var out = document.getElementById('report-out');
  if (!out) return;
  var paste = document.getElementById('report-paste');
  var errBox = document.getElementById('report-error');
  var actions = document.getElementById('report-actions');
  var input = document.getElementById('report-input');

  var S = {};
  try { S = JSON.parse(document.getElementById('report-strings').textContent); } catch (e) {}
  function s(k) { return S[k] !== undefined ? S[k] : k; }
  function fmt(tmpl, val) { return String(tmpl).replace('{n}', val); }

  function arr(x) { return Array.isArray(x) ? x : []; }
  function num(x) { return typeof x === 'number' && isFinite(x) ? x : 0; }
  function str(x) { return typeof x === 'string' ? x : (x == null ? '' : String(x)); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var lastReport = null;

  /* ------------------------------------------------------------ decode */

  function parseFragment(hash) {
    var res = {};
    var raw = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    raw.split('&').forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf('=');
      var k = i === -1 ? pair : pair.slice(0, i);
      var v = i === -1 ? '' : pair.slice(i + 1);
      try { v = decodeURIComponent(v); } catch (e) {}
      res[k] = v;
    });
    return res;
  }

  function extractBlob(rawIn) {
    var raw = (rawIn || '').trim();
    if (!raw) return '';
    var h = raw.indexOf('#');
    if (h !== -1) return parseFragment(raw.slice(h)).d || '';
    if (raw.indexOf('d=') === 0 || raw.indexOf('&') !== -1) {
      var f = parseFragment(raw);
      if (f.d) return f.d;
    }
    return raw;
  }

  function b64urlToBytes(b64) {
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function gunzip(bytes) {
    if (typeof DecompressionStream !== 'undefined') {
      var ds = new DecompressionStream('gzip');
      var w = ds.writable.getWriter();
      w.write(bytes); w.close();
      return new Response(ds.readable).arrayBuffer()
        .then(function (buf) { return new Uint8Array(buf); });
    }
    return Promise.reject({ code: 'err_nogzip' });
  }

  function decode(blob) {
    return new Promise(function (resolve, reject) {
      var dot = blob.indexOf('.');
      if (dot === -1) return reject({ code: 'err_corrupt' });
      var tag = blob.slice(0, dot);
      if (tag !== 'R1') return reject({ code: 'err_unsupported' });
      var bytes;
      try { bytes = b64urlToBytes(blob.slice(dot + 1)); }
      catch (e) { return reject({ code: 'err_corrupt' }); }
      gunzip(bytes).then(function (u8) {
        var obj = JSON.parse(new TextDecoder('utf-8').decode(u8));
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw 0;
        resolve(obj);
      }).catch(function (e) {
        reject(e && e.code ? e : { code: 'err_corrupt' });
      });
    });
  }
  /* ------------------------------------------------------------ render */

  function table(headings, rows) {
    var wrap = el('div', 'table-wrap');
    var tbl = el('table', 'data');
    var thead = el('thead'), htr = el('tr');
    headings.forEach(function (h) { htr.appendChild(el('th', null, h)); });
    thead.appendChild(htr); tbl.appendChild(thead);
    var tb = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      r.forEach(function (c) { tr.appendChild(el('td', null, String(c))); });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl);
    return wrap;
  }

  function details(summaryText) {
    var d = el('details', 'report__det');
    d.appendChild(el('summary', null, summaryText));
    return d;
  }

  function fmtTime(unixS) {
    try { return new Date(num(unixS) * 1000).toLocaleString(); }
    catch (e) { return String(unixS); }
  }

  function banner(v, ticket) {
    var fault = str(v.fault) || 'unknown';
    var tone = s('tone_' + fault);
    if (tone === 'tone_' + fault) tone = 'neutral';
    var box = el('div', 'report__verdict');
    box.setAttribute('data-tone', tone);
    if (ticket) box.appendChild(el('p', 'report__ticket', fmt(s('ticket'), ticket)));
    box.appendChild(el('h2', 'report__headline', str(v.headline) || s('fault_' + fault + '_head')));
    box.appendChild(el('p', 'report__body', s('fault_' + fault + '_body')));
    var subs = [];
    if (str(v.health)) subs.push(s('health') + ': ' + str(v.health));
    if (str(v.causeCode)) subs.push(s('cause') + ': ' + str(v.causeCode));
    if (str(v.layer)) subs.push(s('layer') + ': ' + str(v.layer));
    if (subs.length) box.appendChild(el('p', 'report__sub faint', subs.join(' · ')));
    return box;
  }

  function fact(label, big, sub) {
    var c = el('div', 'report__fact');
    c.appendChild(el('span', 'report__fact-k', label));
    c.appendChild(el('strong', 'report__fact-v', big));
    if (sub) c.appendChild(el('span', 'report__fact-s faint', sub));
    return c;
  }

  function facts(r) {
    var rd = r.runtimeDial || {};
    var att = num(rd.attempts), suc = num(rd.success);
    var pct = att > 0 ? Math.round(suc / att * 100) : 0;
    var wrap = el('div', 'report__facts');
    wrap.appendChild(fact(s('facts_dials'), suc + ' / ' + att, pct + '% · ' + s('facts_dials_sub')));
    wrap.appendChild(fact(s('facts_flagged'), String(arr(r.nodes).length), ''));
    var up = r.subscriptionUpdate;
    if (up && up.attempted) wrap.appendChild(fact(s('facts_update'), num(up.failures) + ' / ' + num(up.attempts), s('facts_update_sub')));
    else wrap.appendChild(fact(s('facts_update'), s('not_run'), ''));
    return wrap;
  }

  function nodesTable(r) {
    var nodes = arr(r.nodes).slice().sort(function (a, b) { return num(b.failures) - num(a.failures); });
    if (!nodes.length) return null;
    var sec = el('div', 'report__block');
    sec.appendChild(el('h3', null, s('sec_nodes')));
    var head = [s('col_alias'), s('col_proto'), s('col_transport'), s('col_egress'),
      s('col_groups'), s('col_attempts'), s('col_fails'), s('col_success'),
      s('col_streak'), s('col_class'), s('col_delay')];
    var rows = nodes.map(function (n) {
      var delay = num(n.delayBucketMs) ? fmt(s('delay_le'), num(n.delayBucketMs)) : '—';
      return [str(n.alias), str(n.protocol), str(n.transport), str(n.egressCountry),
        arr(n.groups).join(', '), num(n.attempts), num(n.failures), num(n.successes),
        num(n.failStreak), str(n.dominantClass), delay];
    });
    sec.appendChild(table(head, rows));
    return sec;
  }

  function dialBreak(r) {
    var rd = r.runtimeDial || {};
    var parts = [
      [s('dl_transport'), arr(rd.byTransport), 'key'],
      [s('dl_protocol'), arr(rd.byProtocol), 'key'],
      [s('dl_group'), arr(rd.byGroup), 'group'],
      [s('dl_egress'), arr(rd.byEgress), 'key']
    ];
    var det = details(s('sec_dial'));
    var any = false;
    parts.forEach(function (p) {
      var list = p[1]; if (!list.length) return; any = true;
      det.appendChild(el('h4', null, p[0]));
      det.appendChild(table([s('col_key'), s('col_attempts'), s('col_failure')],
        list.map(function (o) { return [str(o[p[2]]), num(o.attempts), num(o.failure)]; })));
    });
    var cls = arr(rd.byErrorClass);
    if (cls.length) {
      any = true;
      det.appendChild(el('h4', null, s('dl_class')));
      det.appendChild(table([s('col_class'), s('col_count')],
        cls.map(function (c) { return [str(c['class']), num(c.count)]; })));
    }
    return any ? det : null;
  }

  function updateBlock(r) {
    var up = r.subscriptionUpdate;
    if (!up || !up.attempted) return null;
    var det = details(s('sec_update'));
    var flags = [s('up_succeeded') + ': ' + (up.succeeded ? s('yes') : s('no'))];
    if (up.hwidRejected) flags.push(s('up_hwid'));
    if (up.emptyResponse) flags.push(s('up_empty'));
    if (up.undialable) flags.push(s('up_undialable'));
    if (str(up.dominantError)) flags.push(s('up_dominant') + ': ' + str(up.dominantError));
    det.appendChild(el('p', 'faint', flags.join(' · ')));
    var st = arr(up.byStage);
    if (st.length) {
      det.appendChild(el('h4', null, s('up_bystage')));
      det.appendChild(table([s('col_stage'), s('col_attempts'), s('col_fails'), s('up_dominant')],
        st.map(function (x) { return [str(x.stage), num(x.attempts), num(x.failures), str(x.dominantError)]; })));
    }
    var hosts = arr(up.hosts);
    if (hosts.length) {
      det.appendChild(el('h4', null, s('up_hosts')));
      det.appendChild(table([s('col_host'), s('col_attempts'), s('col_fails'), s('col_success'), s('col_lasterror')],
        hosts.map(function (x) { return [str(x.host), num(x.attempts), num(x.failures), (x.succeeded ? s('yes') : s('no')), str(x.lastError)]; })));
    }
    return det;
  }

  function envBlock(r) {
    var det = details(s('sec_env'));
    var dl = el('dl', 'report__env');
    function d(term, val) {
      if (val === '' || val == null) return;
      dl.appendChild(el('dt', null, term));
      dl.appendChild(el('dd', null, String(val)));
    }
    d(s('env_terrain'), str(r.terrain));
    d(s('env_env'), str(r.env));
    d(s('env_presets'), arr(r.presets).join(', '));
    d(s('env_platform'), (str(r.platform) + ' ' + str(r.architecture)).trim());
    d(s('env_app'), str(r.appVersion));
    d(s('env_core'), str(r.coreVersion));
    if (num(r.windowStart) && num(r.windowEnd)) d(s('env_window'), fmtTime(r.windowStart) + ' — ' + fmtTime(r.windowEnd));
    d(s('env_nodes'), num(r.configNodeCount) + ' / ' + num(r.observedNodeCount));
    if (num(r.droppedEvents) > 0) d(s('env_dropped'), num(r.droppedEvents));
    det.appendChild(dl);
    return det;
  }

  function render(report, ticket) {
    lastReport = report;
    out.textContent = '';
    out.appendChild(banner(report.verdict || {}, ticket));
    out.appendChild(facts(report));
    [nodesTable(report), dialBreak(report), updateBlock(report), envBlock(report)]
      .forEach(function (node) { if (node) out.appendChild(node); });
    if (paste) paste.hidden = true;
    if (errBox) errBox.hidden = true;
    if (actions) actions.hidden = false;
  }

  function fail(code) {
    out.textContent = '';
    if (errBox) { errBox.textContent = s(code || 'err_corrupt'); errBox.hidden = false; }
    if (actions) actions.hidden = true;
    if (paste) paste.hidden = false;
  }

  /* ------------------------------------------------------------ boot */

  var RC = window.RC || {};

  function run(blob, ticket) {
    if (!blob) {
      if (paste) paste.hidden = false;
      if (actions) actions.hidden = true;
      if (errBox) errBox.hidden = true;
      out.textContent = '';
      return;
    }
    decode(blob).then(function (r) { render(r, ticket); })
      .catch(function (e) { fail(e && e.code); });
  }

  function ticketOf(frag) {
    return /^[A-Za-z0-9._-]{1,64}$/.test(frag.t || '') ? frag.t : '';
  }

  function fromHash() {
    var f = parseFragment(location.hash || '');
    run(f.d || '', ticketOf(f));
  }

  var goBtn = document.getElementById('report-go');
  if (goBtn) goBtn.addEventListener('click', function () {
    var raw = input ? input.value.trim() : '';
    var frag = {};
    var h = raw.indexOf('#');
    if (h !== -1) frag = parseFragment(raw.slice(h));
    else if (raw.indexOf('d=') === 0 || raw.indexOf('&') !== -1) frag = parseFragment(raw);
    run(extractBlob(raw), ticketOf(frag));
  });

  var copyBtn = document.getElementById('report-copy');
  if (copyBtn && RC.copyText) copyBtn.addEventListener('click', function () {
    if (!lastReport) return;
    var label = copyBtn.textContent;
    var done = copyBtn.getAttribute('data-done-label') || label;
    RC.copyText(JSON.stringify(lastReport, null, 2)).then(function () {
      copyBtn.textContent = done;
      setTimeout(function () { copyBtn.textContent = label; }, 1600);
    }).catch(function () {});
  });

  var dlBtn = document.getElementById('report-download');
  if (dlBtn) dlBtn.addEventListener('click', function () {
    if (!lastReport) return;
    var data = JSON.stringify(lastReport, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'reclash-report-' + (num(lastReport.generatedAt) || 'report') + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
