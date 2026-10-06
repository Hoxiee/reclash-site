/* Landing page: the hero signal field and the living mark. */
(function () {
  'use strict';

  var $ = RC.$, $$ = RC.$$;

  /* ================================================= hero signal field
     A sparse, living mesh in ReClash's own motif: a handful of upright bars,
     each sheared by the brand tilt and capped round, standing in the open
     margins around the copy. A bar rises, breathes its height for a while,
     then sinks and hops to another free slot — the field re-routes itself the
     way signal finds a new path, never crowding the screen. It keeps clear of
     the copy and the mark, pauses off-screen or when the tab is hidden,
     quickens with the scroll, and hops the bars the pointer sweeps past.
     No per-frame glow and only a dozen-odd bars, so it stays cheap. */
  (function () {
    var canvas = $('.hero__canvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var LEAN = 0.26;         /* top-of-bar shear, echoing the --tilt buttons */
    var PIXEL_BUDGET = 10e6;

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
    function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
    function pick(list) { return list[(Math.random() * list.length) | 0]; }
    function ease(t) { return t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); }

    /* Content boxes sit under .hero__inner, which is a positioned .shell, so
       their offsetLeft/Top read against that centred box — not the canvas,
       whose offset parent is the hero. Walking the offset-parent chain up to
       the hero puts every box in the canvas's own coordinates, and because it
       uses layout (not transform) positions it is immune to the entrance
       animation's translate/scale. */
    var root = canvas.offsetParent;
    function boxIn(node) {
      var left = 0, top = 0, n = node;
      while (n && n !== root) { left += n.offsetLeft; top += n.offsetTop; n = n.offsetParent; }
      return { left: left, top: top, right: left + node.offsetWidth, bottom: top + node.offsetHeight };
    }
    function blocks() {
      return $$('.hero__copy > .enter, .hero__meta, .hero__title, .hero__lede, ' +
        '.hero__actions, .hero__plats, .hero__stage')
        .filter(function (n) { return n.offsetWidth; })
        .map(function (n) {
          var r = boxIn(n);
          return { left: r.left - pitch, right: r.right + pitch, top: r.top - pitch, bottom: r.bottom + pitch };
        });
    }

    function hex(s) {
      s = s.replace('#', '');
      if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
      return 'rgb(' + parseInt(s.slice(0, 2), 16) + ',' +
        parseInt(s.slice(2, 4), 16) + ',' + parseInt(s.slice(4, 6), 16) + ')';
    }

    var width = 0, height = 0, pitch = 0, pool = [], cells = [], bars = [];
    var frame = 0, last = 0, clock = 0, tempo = 1, onScreen = true, pointer = null;
    var scrollAt = { y: window.scrollY, time: performance.now() };

    function measure() {
      var r = canvas.getBoundingClientRect();
      width = r.width; height = r.height;
      var ratio = Math.min(window.devicePixelRatio || 1, 2,
        Math.sqrt(PIXEL_BUDGET / Math.max(width * height, 1)));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      pitch = clamp(width * 0.032, 24, 42);
    }

    function tint() {
      var s = getComputedStyle(canvas);
      function v(i) { return hex(s.getPropertyValue('--field-' + i).trim() || '#333'); }
      /* Weighted toward the quiet hues; a bright brand bar surfaces rarely. */
      pool = [v(1), v(1), v(1), v(2), v(2), v(3), v(4), v(6)];
    }

    /* Candidate slots: a loose grid, keeping only points clear of the copy and
       the mark with room for a bar to stand above them. */
    function chart() {
      cells = [];
      var box = blocks();
      var reach = pitch * 2.4;
      var cols = Math.max(1, Math.round(width / (pitch * 2.2)));
      var rows = Math.max(1, Math.round(height / (pitch * 2.4)));
      for (var cx = 0; cx <= cols; cx++) {
        for (var cy = 0; cy <= rows; cy++) {
          var x = (cx + 0.5) / (cols + 1) * width;
          var y = (cy + 0.5) / (rows + 1) * height;
          if (x < pitch || x > width - pitch || y < pitch || y > height - pitch) continue;
          if (box.some(function (b) {
            return x > b.left && x < b.right && y - reach < b.bottom && y > b.top;
          })) continue;
          cells.push({ x: x, y: y });
        }
      }
    }

    function far() {
      var best = null, bestD = -1;
      for (var i = 0; i < 10 && cells.length; i++) {
        var c = pick(cells), d = 1e9;
        for (var j = 0; j < bars.length; j++) {
          var dd = Math.hypot(bars[j].x - c.x, bars[j].y - c.y);
          if (dd < d) d = dd;
        }
        if (d > bestD) { bestD = d; best = c; }
      }
      return best;
    }

    function born(b) {
      var c = far();
      if (!c) return b;
      b = b || {};
      b.x = c.x; b.y = c.y;
      b.rest = pitch * rand(0.6, 1.15);
      b.amp = b.rest * rand(0.16, 0.26);
      b.phase = rand(0, 6.28);
      b.speed = rand(0.5, 0.95);
      b.hue = pick(pool);
      b.phase2 = 'rise';
      b.t = 0; b.span = rand(0.5, 0.7);
      return b;
    }

    function seed() {
      bars = [];
      if (!cells.length) return;
      var total = clamp(Math.round(cells.length * 0.3), 4, width < 700 ? 7 : 15);
      for (var i = 0; i < total; i++) {
        var b = born(null);
        if (!b.x && b.x !== 0) break;
        b.phase2 = 'live'; b.span = rand(2.5, 6); b.t = rand(0, b.span); b.w = 1;
        bars.push(b);
      }
    }

    function advance(b, dt) {
      b.t += dt;
      var p = b.span ? b.t / b.span : 1;
      if (b.phase2 === 'rise') { b.w = ease(p); if (p >= 1) { b.w = 1; b.phase2 = 'live'; b.t = 0; b.span = rand(2.5, 6); } }
      else if (b.phase2 === 'live') { b.w = 1; if (p >= 1) { b.phase2 = 'sink'; b.t = 0; b.span = rand(0.45, 0.65); } }
      else { b.w = 1 - ease(p); if (p >= 1) born(b); }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineWidth = pitch * 0.4;
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i];
        if (b.w < 0.02) continue;
        var breathe = 0.5 + 0.5 * Math.sin(clock * b.speed + b.phase);
        var h = (b.rest + b.amp * breathe) * (0.6 + 0.4 * b.w);
        ctx.globalAlpha = b.w;
        ctx.strokeStyle = b.hue;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + h * LEAN, b.y - h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function stir() {
      var r = canvas.getBoundingClientRect();
      var px = pointer.x - r.left, py = pointer.y - r.top;
      pointer = null;
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i];
        if (b.phase2 === 'live' && Math.hypot(b.x - px, b.y - 0.5 * b.rest - py) < pitch * 2.2) {
          b.phase2 = 'sink'; b.t = 0; b.span = 0.45;
        }
      }
    }

    function tick(now) {
      frame = requestAnimationFrame(tick);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tempo += (1 - tempo) * Math.min(1, dt * 2.5);
      clock += dt * tempo;
      if (pointer) stir();
      for (var i = 0; i < bars.length; i++) advance(bars[i], dt * tempo);
      draw();
    }

    function sync() {
      var go = onScreen && !document.hidden && !RC.reduced;
      if (go && !frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
      else if (!go && frame) { cancelAnimationFrame(frame); frame = 0; }
    }

    function rebuild() { measure(); tint(); chart(); seed(); draw(); }

    rebuild();
    if (RC.reduced) return;  /* a still mesh; no loop, no listeners */

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        var r = canvas.getBoundingClientRect();
        if (Math.abs(r.width - width) > 1 || Math.abs(r.height - height) > 1) rebuild();
      }).observe(canvas);
    } else {
      window.addEventListener('resize', rebuild, { passive: true });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; sync(); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'touch' && frame) pointer = { x: e.clientX, y: e.clientY };
    }, { passive: true });
    window.addEventListener('scroll', function () {
      var now = performance.now();
      var speed = Math.abs(window.scrollY - scrollAt.y) / Math.max(now - scrollAt.time, 8) * 1000;
      scrollAt = { y: window.scrollY, time: now };
      tempo = Math.max(tempo, 1 + Math.min(speed / 700, 2));
    }, { passive: true });
    sync();
  })();

  /* ======================================================= the living mark */

  var mark = $('.hero__mark');
  if (mark) {
    var strokes = $$('.stroke', mark);
    var spread = 0;
    var target = 0;
    var drawn = false;

    strokes.forEach(function (st) {
      var len = st.getTotalLength ? st.getTotalLength() : 300;
      st.style.strokeDasharray = len;
      st.style.strokeDashoffset = RC.reduced ? 0 : len;
    });

    function draw() {
      if (drawn) return;
      drawn = true;
      strokes.forEach(function (st, i) {
        st.style.transition = 'stroke-dashoffset 1.05s cubic-bezier(0.16,1,0.3,1) ' + (i * 0.13) + 's';
        st.style.strokeDashoffset = 0;
      });
    }

    if (RC.reduced) drawn = true;
    else if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { draw(); mio.disconnect(); }
      }, { threshold: 0.3 });
      mio.observe(mark);
    } else draw();

    mark.addEventListener('pointermove', function (e) {
      var r = mark.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width - 0.5) * 2;
    });
    mark.addEventListener('pointerleave', function () { target = 0; });

    var pulse = 0;
    function markFrame() {
      requestAnimationFrame(markFrame);
      spread += (target - spread) * 0.08;
      pulse += 0.012;
      strokes.forEach(function (st, i) {
        var w = (i - 1) * spread * 13;
        var y = Math.sin(pulse + i * 1.15) * 4;
        st.setAttribute('transform', 'translate(' + w.toFixed(2) + ' ' + y.toFixed(2) + ')');
      });
    }
    if (!RC.reduced) requestAnimationFrame(markFrame);

    mark.addEventListener('click', function () {
      drawn = false;
      strokes.forEach(function (st) {
        var len = st.getTotalLength ? st.getTotalLength() : 300;
        st.style.transition = 'none';
        st.style.strokeDashoffset = len;
      });
      // force reflow so the reset is applied before the new transition
      void mark.offsetWidth;
      draw();
    });
  }

  /* Pointer parallax: the whole stage leans toward the cursor. CSS springs the
     --rx/--ry back to flat on its own transition, so no reset loop is needed. */
  var stage = $('.hero__stage');
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (stage && fine && !RC.reduced) {
    var tilting = false;
    window.addEventListener('pointermove', function (e) {
      if (tilting) return;
      tilting = true;
      requestAnimationFrame(function () {
        tilting = false;
        var r = stage.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
        stage.style.setProperty('--rx', (Math.max(-1, Math.min(1, dx)) * 7).toFixed(2) + 'deg');
        stage.style.setProperty('--ry', (Math.max(-1, Math.min(1, -dy)) * 7).toFixed(2) + 'deg');
      });
    }, { passive: true });
  }

})();

/* ===================================== providers: headers → result diptych */
/* One dark response panel, one flat app surface. Each tab carries a provider
   preset in its data-* attributes; picking (or the idle carousel) rewrites the
   header values on the left, flashes the lines that changed, and repaints the
   right panel — the two accent custom properties morph in CSS because both are
   @property-registered and transitioned. With no JS the first preset is simply
   the one already rendered. */
(function () {
  var $ = RC.$, $$ = RC.$$;
  var demo = $('.hdemo');
  if (!demo) return;
  var tabs = $$('.hdemo__tab', demo);
  if (!tabs.length) return;

  var nameEl = $('.hdemo__name', demo);
  var renewEl = $('.hdemo__renew', demo);
  var announceEl = $('.hdemo__announce', demo);
  var noteEl = $('.hdemo__note', demo);

  /* header value lines, keyed by data-f */
  var lines = {};
  $$('.hdemo__ln[data-f]', demo).forEach(function (el) {
    lines[el.getAttribute('data-f')] = el.querySelector('.hdemo__v');
  });

  function setLine(field, value, flash) {
    var v = lines[field];
    if (!v) return;
    if (v.textContent !== value) {
      v.textContent = value;
      if (flash) {
        var ln = v.closest('.hdemo__ln');
        ln.classList.remove('is-diff');
        void ln.offsetWidth; /* restart the diff flash */
        ln.classList.add('is-diff');
      }
    }
  }

  function apply(tab, flash) {
    var d = tab.dataset;
    demo.dataset.brand = d.brand;
    demo.style.setProperty('--accent', d.accent);
    demo.style.setProperty('--accent2', d.accent2);

    setLine('servicename', d.name, flash);
    setLine('hex', d.hex, flash);
    setLine('announce', d.announce, flash);
    setLine('buyplan', d.renew || '—', flash);

    if (nameEl) nameEl.textContent = d.name;
    if (announceEl) announceEl.textContent = d.announce;
    if (noteEl) noteEl.textContent = d.node;
    if (renewEl) { renewEl.textContent = d.renew || ''; renewEl.hidden = !d.renew; }

    tabs.forEach(function (b) {
      var on = b === tab;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-on', on);
    });

    demo.classList.remove('is-morph');
    void demo.offsetWidth; /* restart the panel flash */
    demo.classList.add('is-morph');
  }

  var idx = 0, timer = null, manual = false;

  function advance() {
    if (manual) return;
    idx = (idx + 1) % tabs.length;
    apply(tabs[idx], true);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() {
    if (RC.reduced || manual) return;
    stop();
    timer = setInterval(advance, 3600);
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      manual = true; stop(); idx = i; apply(tab, true);
    });
  });

  demo.addEventListener('pointerenter', stop);
  demo.addEventListener('pointerleave', start);
  demo.addEventListener('focusin', stop);

  start();
})();

/* ============================================ stat band: numerals count up */
/* Each .stat__num that is a plain integer ticks from zero to its value the
   first time the band scrolls into view. The final number is already in the
   HTML, so with no JS, without IntersectionObserver, or under reduced motion
   the band simply shows its finished figures — the animation only ever adds
   motion, never supplies the content. */
(function () {
  var band = RC.$('.statband');
  if (!band || RC.reduced || !('IntersectionObserver' in window)) return;

  var nums = RC.$$('.stat__num', band).filter(function (el) {
    return /^\d+$/.test(el.textContent.trim());
  });
  if (!nums.length) return;

  var targets = nums.map(function (el) {
    var end = parseInt(el.textContent, 10);
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.textContent = '0';
    return end;
  });

  function run() {
    var start = 0;
    var dur = 900;
    function step(now) {
      if (!start) start = now;
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      nums.forEach(function (el, i) {
        el.textContent = Math.round(targets[i] * e);
      });
      if (p < 1) requestAnimationFrame(step);
      else nums.forEach(function (el) { el.style.minWidth = ''; });
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { run(); io.disconnect(); }
  }, { threshold: 0.4 });
  io.observe(band);
})();
