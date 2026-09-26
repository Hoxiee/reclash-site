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
  var mapPanel = document.getElementById('report-map');
  var mapInput = document.getElementById('report-map-input');
  var mapMsg = document.getElementById('report-map-msg');

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
  var matchMap = null;
  var nodesBlockEl = null;

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
  /* --------------------------------------------- subscription matching

     The provider owns the subscription, so pasting its body lets us resolve
     each anonymous node-NN back to a real name — mirroring the app's own label
     logic (protocol = type, groups = memberships, positionHint = 1-based index
     in the first group that lists the node). Everything below is a small,
     forgiving Clash/mihomo YAML reader; it never touches the network. */

  function indentOf(line) { return line.length - line.replace(/^ +/, '').length; }

  function unq(v) {
    var t = String(v == null ? '' : v).trim();
    if (t.length >= 2 && (t.charAt(0) === '"' || t.charAt(0) === "'") &&
        t.charAt(t.length - 1) === t.charAt(0)) {
      t = t.slice(1, -1).replace(/\\"/g, '"');
    }
    return t.trim();
  }

  function kvInto(line, obj) {
    var m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (m) obj[m[1]] = unq(m[2]);
  }

  function splitTop(inner) {
    var parts = [], depth = 0, quote = '', buf = '';
    for (var i = 0; i < inner.length; i++) {
      var ch = inner.charAt(i);
      if (quote) { if (ch === quote) quote = ''; buf += ch; continue; }
      if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
      if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') depth--;
      if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
      buf += ch;
    }
    if (buf.trim()) parts.push(buf);
    return parts;
  }

  function parseFlowMap(s, obj) {
    var inner = s.trim().replace(/^\{/, '').replace(/\}$/, '');
    splitTop(inner).forEach(function (p) { kvInto(p.trim(), obj); });
  }

  function parseFlowList(s) {
    var inner = s.trim().replace(/^\[/, '').replace(/\]$/, '');
    return splitTop(inner).map(function (p) { return unq(p); }).filter(Boolean);
  }

  function itemsUnder(lines, keyRe) {
    var start = -1, base = 0;
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(keyRe);
      if (m) { start = i + 1; base = indentOf(lines[i]); break; }
    }
    if (start === -1) return [];
    var items = [], cur = null, itemIndent = null;
    for (var j = start; j < lines.length; j++) {
      var ln = lines[j];
      if (!ln.trim()) { if (cur) cur.push(ln); continue; }
      var ind = indentOf(ln);
      if (ind <= base) break;
      var t = ln.trim();
      if (itemIndent === null && t.charAt(0) === '-') itemIndent = ind;
      if (ind === itemIndent && t.charAt(0) === '-') { cur = [ln]; items.push(cur); }
      else if (cur) cur.push(ln);
    }
    return items;
  }

  function parseProxyItem(itemLines) {
    var f = {};
    var first = itemLines[0].trim().replace(/^-\s*/, '');
    if (first.charAt(0) === '{') { parseFlowMap(first, f); return f; }
    kvInto(first, f);
    for (var i = 1; i < itemLines.length; i++) {
      var t = itemLines[i].trim();
      if (t && t.charAt(0) !== '#') kvInto(t, f);
    }
    return f;
  }

  function parseGroupItem(itemLines) {
    var name = null, members = [], inProxies = false;
    itemLines.forEach(function (raw, idx) {
      var t = raw.trim();
      if (!t || t.charAt(0) === '#') return;
      if (idx === 0) t = t.replace(/^-\s*/, '');
      if (t.charAt(0) === '-') { if (inProxies) members.push(unq(t.replace(/^-\s*/, ''))); return; }
      var m = t.match(/^([\w-]+)\s*:\s*(.*)$/);
      if (!m) return;
      var key = m[1], val = m[2].trim();
      if (key === 'name') { name = unq(val); inProxies = false; }
      else if (key === 'proxies') {
        if (val.charAt(0) === '[') { members = members.concat(parseFlowList(val)); inProxies = false; }
        else inProxies = true;
      } else inProxies = false;
    });
    return { name: name, members: members };
  }

  function parseClash(text) {
    var lines = String(text).replace(/\r/g, '').split('\n');
    var proxies = itemsUnder(lines, /^\s*proxies\s*:\s*$/).map(parseProxyItem)
      .filter(function (p) { return p.name; });
    var groups = itemsUnder(lines, /^\s*proxy-groups\s*:\s*$/).map(parseGroupItem)
      .filter(function (g) { return g.name; });
    return { proxies: proxies, groups: groups };
  }

  function tryB64(text) {
    var s = text.replace(/\s+/g, '');
    if (!s || !/^[A-Za-z0-9+/_=-]+$/.test(s) || s.length < 24) return null;
    try {
      var bytes = b64urlToBytes(s.replace(/=+$/, ''));
      var txt = new TextDecoder('utf-8').decode(bytes);
      return /proxies\s*:/.test(txt) ? txt : null;
    } catch (e) { return null; }
  }

  function parseSub(raw) {
    var text = String(raw || '').replace(/^﻿/, '');
    var r = parseClash(text);
    if (!r.proxies.length) {
      var dec = tryB64(text);
      if (dec) r = parseClash(dec);
    }
    return r;
  }

  function normGroups(g) {
    return arr(g).map(function (x) { return str(x).trim(); })
      .filter(Boolean).sort().join('\u0001');
  }

  function labelsOf(sub) {
    var positions = {}, memberships = {};
    arr(sub.groups).forEach(function (gr) {
      arr(gr.members).forEach(function (mn, i) {
        if (!memberships[mn]) memberships[mn] = [];
        memberships[mn].push(gr.name);
        if (!(mn in positions)) positions[mn] = i + 1;
      });
    });
    return arr(sub.proxies).map(function (p) {
      return {
        name: p.name, server: str(p.server), protocol: str(p.type),
        transport: str(p.network), groups: memberships[p.name] || [],
        positionHint: positions[p.name] || 0
      };
    });
  }

  function matchNode(n, labels) {
    var proto = str(n.protocol), ng = normGroups(n.groups), ph = num(n.positionHint);
    var cohort = labels.filter(function (l) {
      return str(l.protocol) === proto && normGroups(l.groups) === ng;
    });
    if (!cohort.length) return { conf: 'none' };
    var exact = cohort.filter(function (l) { return num(l.positionHint) === ph; });
    if (exact.length === 1) return { conf: 'exact', node: exact[0] };
    if (cohort.length === 1) return { conf: 'likely', node: cohort[0] };
    var pick = exact.length ? exact : cohort;
    return { conf: 'ambiguous', list: pick, count: pick.length };
  }

  function buildMatchMap(report, sub) {
    var labels = labelsOf(sub), map = {}, matched = 0;
    arr(report.nodes).forEach(function (n) {
      var m = matchNode(n, labels);
      map[str(n.alias)] = m;
      if (m.conf === 'exact' || m.conf === 'likely') matched++;
    });
    map.__matched = matched;
    map.__total = arr(report.nodes).length;
    return map;
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

  function pill(text, cls) {
    return el('span', 'report__pill' + (cls ? ' ' + cls : ''), text);
  }

  function bar(fail, total, tone) {
    var pct = total > 0 ? Math.round(fail / total * 100) : 0;
    var wrap = el('div', 'report__bar');
    var fill = el('div', 'report__bar-fill');
    fill.style.width = pct + '%';
    if (tone) fill.setAttribute('data-tone', tone);
    wrap.appendChild(fill);
    return wrap;
  }

  function fmtTime(unixMs) {
    try { return new Date(num(unixMs)).toLocaleString(); }
    catch (e) { return String(unixMs); }
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
    var pills = el('div', 'report__pills');
    var any = false;
    if (str(v.health)) { pills.appendChild(pill(s('health') + ': ' + str(v.health))); any = true; }
    if (str(v.causeCode)) { pills.appendChild(pill(s('cause') + ': ' + str(v.causeCode))); any = true; }
    if (str(v.layer)) { pills.appendChild(pill(s('layer') + ': ' + str(v.layer))); any = true; }
    if (any) box.appendChild(pills);
    return box;
  }

  function fact(label, big, sub, extra) {
    var c = el('div', 'report__fact');
    c.appendChild(el('span', 'report__fact-k', label));
    c.appendChild(el('strong', 'report__fact-v', big));
    if (sub) c.appendChild(el('span', 'report__fact-s faint', sub));
    if (extra) c.appendChild(extra);
    return c;
  }

  function facts(r) {
    var rd = r.runtimeDial || {};
    var att = num(rd.attempts), suc = num(rd.success);
    var pct = att > 0 ? Math.round(suc / att * 100) : 0;
    var tone = pct >= 60 ? 'good' : (pct >= 25 ? 'warn' : 'bad');
    var wrap = el('div', 'report__facts');
    wrap.appendChild(fact(s('facts_dials'), suc + ' / ' + att,
      pct + '% · ' + s('facts_dials_sub'), bar(suc, att, tone)));
    wrap.appendChild(fact(s('facts_flagged'), String(arr(r.nodes).length), ''));
    var up = r.subscriptionUpdate;
    if (up && up.attempted) wrap.appendChild(fact(s('facts_update'), num(up.failures) + ' / ' + num(up.attempts), s('facts_update_sub')));
    else wrap.appendChild(fact(s('facts_update'), s('not_run'), ''));
    return wrap;
  }

  function revealCell(m) {
    var td = el('td', 'report__reveal');
    if (!m || m.conf === 'none') {
      td.appendChild(pill(s('conf_none'), 'report__conf report__conf--none'));
      return td;
    }
    if (m.conf === 'exact' || m.conf === 'likely') {
      td.className = 'report__reveal report__reveal--on';
      var box = el('div', 'report__reveal-hit');
      box.appendChild(el('strong', 'report__reveal-name', str(m.node.name)));
      if (str(m.node.server)) box.appendChild(el('span', 'report__reveal-host faint', str(m.node.server)));
      box.appendChild(pill(s('conf_' + m.conf), 'report__conf report__conf--' + m.conf));
      td.appendChild(box);
      return td;
    }
    td.className = 'report__reveal report__reveal--on';
    var wrap = el('div', 'report__reveal-hit');
    var names = arr(m.list).slice(0, 3).map(function (l) { return str(l.name); }).join(', ');
    wrap.appendChild(el('span', 'report__reveal-name', names));
    wrap.appendChild(pill(fmt(s('cand_n'), num(m.count)), 'report__conf report__conf--ambiguous'));
    td.appendChild(wrap);
    return td;
  }

  function nodesTable(r, mm) {
    var nodes = arr(r.nodes).slice().sort(function (a, b) { return num(b.failures) - num(a.failures); });
    if (!nodes.length) return null;
    var sec = el('div', 'report__block');
    sec.appendChild(el('h3', null, s('sec_nodes')));
    var head = [s('col_alias'), s('col_proto'), s('col_transport'), s('col_egress'),
      s('col_groups'), s('col_attempts'), s('col_fails'), s('col_success'),
      s('col_streak'), s('col_class'), s('col_delay')];
    if (mm) head.splice(1, 0, s('map_col_real'));

    var wrap = el('div', 'table-wrap');
    var tbl = el('table', 'data');
    var thead = el('thead'), htr = el('tr');
    head.forEach(function (h) { htr.appendChild(el('th', null, h)); });
    thead.appendChild(htr); tbl.appendChild(thead);
    var tb = el('tbody');
    nodes.forEach(function (n) {
      var delay = num(n.delayBucketMs) ? fmt(s('delay_le'), num(n.delayBucketMs)) : '—';
      var cells = [str(n.alias), str(n.protocol), str(n.transport), str(n.egressCountry),
        arr(n.groups).join(', '), num(n.attempts), num(n.failures), num(n.successes),
        num(n.failStreak), str(n.dominantClass), delay];
      var reveal = mm ? revealCell(mm[str(n.alias)]) : null;
      var tr = el('tr');
      cells.forEach(function (c, ci) {
        tr.appendChild(el('td', null, String(c)));
        if (reveal && ci === 0) tr.appendChild(reveal);
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); wrap.appendChild(tbl);
    sec.appendChild(wrap);
    return sec;
  }

  function rerenderNodes() {
    if (!lastReport || !nodesBlockEl || !nodesBlockEl.parentNode) return;
    var fresh = nodesTable(lastReport, matchMap);
    if (fresh) { nodesBlockEl.parentNode.replaceChild(fresh, nodesBlockEl); nodesBlockEl = fresh; }
  }

  function brkRow(name, fail, att) {
    var row = el('div', 'report__brk-row');
    row.appendChild(el('span', 'report__brk-k', name));
    var pct = att > 0 ? Math.round(fail / att * 100) : 0;
    var tone = pct >= 60 ? 'bad' : (pct >= 25 ? 'warn' : 'good');
    row.appendChild(bar(fail, att, tone));
    row.appendChild(el('span', 'report__brk-v faint', fail + ' / ' + att));
    return row;
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
      var grp = el('div', 'report__brk');
      list.forEach(function (o) { grp.appendChild(brkRow(str(o[p[2]]), num(o.failure), num(o.attempts))); });
      det.appendChild(grp);
    });
    var cls = arr(rd.byErrorClass);
    if (cls.length) {
      any = true;
      var max = cls.reduce(function (a, c) { return Math.max(a, num(c.count)); }, 0);
      det.appendChild(el('h4', null, s('dl_class')));
      var grp2 = el('div', 'report__brk');
      cls.forEach(function (c) {
        var row = el('div', 'report__brk-row');
        row.appendChild(el('span', 'report__brk-k', str(c['class'])));
        row.appendChild(bar(num(c.count), max, 'bad'));
        row.appendChild(el('span', 'report__brk-v faint', String(num(c.count))));
        grp2.appendChild(row);
      });
      det.appendChild(grp2);
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
    matchMap = null;
    out.textContent = '';
    out.appendChild(banner(report.verdict || {}, ticket));
    out.appendChild(facts(report));
    nodesBlockEl = nodesTable(report, null);
    if (nodesBlockEl) out.appendChild(nodesBlockEl);
    [dialBreak(report), updateBlock(report), envBlock(report)]
      .forEach(function (node) { if (node) out.appendChild(node); });
    if (paste) paste.hidden = true;
    if (errBox) errBox.hidden = true;
    if (actions) actions.hidden = false;
    if (mapPanel) mapPanel.hidden = !nodesBlockEl;
    if (mapMsg) mapMsg.textContent = '';
    if (mapInput) mapInput.value = '';
  }

  function fail(code) {
    lastReport = null;
    out.textContent = '';
    if (errBox) { errBox.textContent = s(code || 'err_corrupt'); errBox.hidden = false; }
    if (actions) actions.hidden = true;
    if (mapPanel) mapPanel.hidden = true;
    if (paste) paste.hidden = false;
  }

  /* ------------------------------------------------------------ boot */

  var RC = window.RC || {};

  function run(blob, ticket) {
    if (!blob) {
      if (paste) paste.hidden = false;
      if (actions) actions.hidden = true;
      if (mapPanel) mapPanel.hidden = true;
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

  function doMatch() {
    if (!lastReport || !mapInput) return;
    var sub = parseSub(mapInput.value);
    if (!arr(sub.proxies).length) {
      matchMap = null;
      rerenderNodes();
      if (mapMsg) mapMsg.textContent = s('map_parse_fail');
      return;
    }
    matchMap = buildMatchMap(lastReport, sub);
    rerenderNodes();
    if (mapMsg) mapMsg.textContent = s('map_matched') + ': ' + matchMap.__matched + ' / ' + matchMap.__total;
    if (nodesBlockEl && nodesBlockEl.scrollIntoView) nodesBlockEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var mapGo = document.getElementById('report-map-go');
  if (mapGo) mapGo.addEventListener('click', doMatch);

  var mapEx = document.getElementById('report-map-example');
  if (mapEx) mapEx.addEventListener('click', function () {
    var d = document.getElementById('report-demo-sub');
    if (d && mapInput) { mapInput.value = d.textContent; doMatch(); }
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

  var resetBtn = document.getElementById('report-reset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    lastReport = null;
    matchMap = null;
    nodesBlockEl = null;
    out.textContent = '';
    if (errBox) errBox.hidden = true;
    if (actions) actions.hidden = true;
    if (mapPanel) mapPanel.hidden = true;
    if (mapMsg) mapMsg.textContent = '';
    if (mapInput) mapInput.value = '';
    if (paste) paste.hidden = false;
    if (input) {
      input.value = '';
      try { input.focus({ preventScroll: true }); } catch (e) {}
    }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (paste && paste.scrollIntoView) paste.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
