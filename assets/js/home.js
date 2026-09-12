/* Landing page: the diagonal hero field, the living mark, the DPI stage. */
(function () {
  'use strict';

  var $ = RC.$, $$ = RC.$$;
  var TAN = 0.36397; /* tan(20deg) — the angle of the mark */

  /* =================================================== hero packet field */

  var canvas = $('.hero__canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var lanes = [];
    var pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    function build() {
      var r = canvas.getBoundingClientRect();
      W = canvas.width = Math.round(r.width * dpr);
      H = canvas.height = Math.round(r.height * dpr);
      var gap = Math.max(52, Math.min(96, r.width / 16)) * dpr;
      var count = Math.ceil((W + H * TAN) / gap) + 2;
      lanes = [];
      for (var i = 0; i < count; i++) {
        lanes.push({
          x: -H * TAN + i * gap,
          bright: Math.random() < 0.18,
          pkts: []
        });
      }
    }

    function spawn() {
      var live = lanes.filter(function (l) { return l.bright; });
      if (!live.length) return;
      var lane = live[(Math.random() * live.length) | 0];
      if (lane.pkts.length > 2) return;
      lane.pkts.push({
        t: 0,
        speed: 0.0016 + Math.random() * 0.0028,
        len: (26 + Math.random() * 70) * dpr,
        hue: Math.random() < 0.5 ? '124,92,255' : '47,211,182'
      });
    }

    var last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!W) return;
      var dt = Math.min(46, now - last || 16);
      last = now;

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      var shift = (pointer.x - 0.5) * 26 * dpr;

      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < lanes.length; i++) {
        var lane = lanes[i];
        var x0 = lane.x + shift;
        var x1 = x0 + H * TAN;

        ctx.beginPath();
        ctx.moveTo(x0, H);
        ctx.lineTo(x1, 0);
        ctx.strokeStyle = lane.bright ? 'rgba(160,140,255,0.10)' : 'rgba(255,255,255,0.035)';
        ctx.lineWidth = dpr;
        ctx.stroke();

        for (var p = lane.pkts.length - 1; p >= 0; p--) {
          var pk = lane.pkts[p];
          pk.t += pk.speed * dt;
          if (pk.t > 1.2) { lane.pkts.splice(p, 1); continue; }
          var y = H - pk.t * (H + pk.len);
          var x = x0 + (H - y) * TAN;
          var y2 = y + pk.len;
          var x2 = x0 + (H - y2) * TAN;
          var grad = ctx.createLinearGradient(x, y, x2, y2);
          grad.addColorStop(0, 'rgba(' + pk.hue + ',0.85)');
          grad.addColorStop(1, 'rgba(' + pk.hue + ',0)');
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.1 * dpr;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    }

    build();
    window.addEventListener('resize', build);
    window.addEventListener('pointermove', function (e) {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    }, { passive: true });

    if (!RC.reduced) {
      requestAnimationFrame(frame);
      setInterval(spawn, 380);
      for (var k = 0; k < 6; k++) spawn();
    } else {
      last = performance.now();
      ctx.clearRect(0, 0, W, H);
      lanes.forEach(function (lane) {
        ctx.beginPath();
        ctx.moveTo(lane.x, H);
        ctx.lineTo(lane.x + H * TAN, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = dpr;
        ctx.stroke();
      });
    }
  }

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

  /* ============================================================ DPI stage */

  var stage = $('.dpi__stage');
  if (stage) {
    var STR = {};
    var box = document.getElementById('dpi-strings');
    if (box) { try { STR = JSON.parse(box.textContent); } catch (e) {} }

    var readout = $('.dpi__readout');
    var modeLabel = $('[data-mode-label]', stage);
    var buttons = $$('.dpi__toggle button');
    var mode = 'split';

    var lanesEl = $$('.dpi__lane', stage);
    var wallEl = $('.dpi__wall', stage);
    var lanesBox = $('.dpi__lanes', stage);

    /* The wall is one skewed line drawn across the whole panel, so the x where
       it crosses a lane depends on how far that lane sits from the centre —
       a fixed 58% would stop the packets well short of the visible line. */
    function wallPctFor(track) {
      if (!wallEl || !lanesBox) return 58;
      var lb = lanesBox.getBoundingClientRect();
      var tb = track.getBoundingClientRect();
      if (!lb.height || !tb.width) return 58;
      var dy = tb.top + tb.height / 2 - (lb.top + lb.height / 2);
      var x = lb.left + lb.width * 0.58 - dy * 0.36397;
      var pct = ((x - tb.left) / tb.width) * 100;
      return Math.max(12, Math.min(88, pct));
    }

    function launch(laneEl, bypass) {
      var track = $('.dpi__track', laneEl);
      if (!track) return;
      var wallPct = wallPctFor(track);
      var pkt = document.createElement('span');
      pkt.className = 'dpi__pkt';
      pkt.style.left = '-2rem';
      track.appendChild(pkt);

      var t = 0;
      var split = false;
      var startTime = performance.now();
      var dur = 2600 + Math.random() * 600;

      function step(now) {
        t = (now - startTime) / dur;
        if (t >= 1) { pkt.remove(); return; }
        var pct = t * 118 - 4;

        if (!bypass && pct >= wallPct) {
          pkt.classList.add('dpi__pkt--blocked');
          pkt.style.left = wallPct + '%';
          pkt.style.opacity = String(Math.max(0, 1 - (t - wallPct / 118) * 9));
          if (pkt.style.opacity === '0') { pkt.remove(); return; }
          requestAnimationFrame(step);
          return;
        }

        if (bypass && !split && pct >= wallPct - 12) {
          split = true;
          pkt.style.width = '0.5rem';
          pkt.style.filter = 'blur(0.2px)';
          for (var i = 1; i < 3; i++) {
            var frag = pkt.cloneNode();
            frag.style.width = '0.5rem';
            frag.setAttribute('data-frag', String(i));
            track.appendChild(frag);
            pkt.__frags = pkt.__frags || [];
            pkt.__frags.push(frag);
          }
        }

        pkt.style.left = pct + '%';
        if (pkt.__frags) {
          pkt.__frags.forEach(function (f, i) {
            f.style.left = (pct - (i + 1) * 2.4) + '%';
          });
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      var cleanup = setTimeout(function () {
        if (pkt.__frags) pkt.__frags.forEach(function (f) { f.remove(); });
        clearTimeout(cleanup);
      }, dur + 60);
    }

    function setMode(next) {
      mode = next;
      var info = (STR.modes && STR.modes[next]) || {};
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-mode') === next ? 'true' : 'false');
      });
      if (readout) readout.textContent = info.note || '';
      if (modeLabel) modeLabel.textContent = info.label || '';
      /* The plain lane never changes; only the ReClash lane reports the mode. */
      lanesEl.forEach(function (laneEl) {
        var v = $('.dpi__lane__verdict', laneEl);
        if (!v) return;
        var ours = laneEl.getAttribute('data-lane') === 'reclash';
        v.textContent = (ours ? info.verdict : STR.direct) || '';
        v.setAttribute('data-ok', ours && info.ok ? 'true' : 'false');
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
    });
    setMode('split');

    var alive = false;
    if ('IntersectionObserver' in window) {
      var dio = new IntersectionObserver(function (e) { alive = e[0].isIntersecting; }, { threshold: 0.15 });
      dio.observe(stage);
    } else alive = true;

    if (!RC.reduced) {
      setInterval(function () {
        if (!alive || document.hidden) return;
        lanesEl.forEach(function (laneEl, i) {
          var bypass = laneEl.getAttribute('data-lane') === 'reclash' && mode !== 'off';
          setTimeout(function () { launch(laneEl, bypass); }, i * 420);
        });
      }, 2200);
    }
  }
})();
