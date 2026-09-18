/* Landing page: the diagonal hero field, the living mark, the dashboard demo. */
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

  /* ===================================================== hero telemetry
     The two chips flanking the mark tick through plausible values so the hero
     reads as a live readout. Decorative and aria-hidden; frozen when the
     visitor asked for less motion. */

  var teleDelay = $('[data-tele="delay"]');
  var teleDown = $('[data-tele="down"]');
  if ((teleDelay || teleDown) && !RC.reduced) {
    var tick = function () {
      if (teleDelay) teleDelay.textContent = (18 + Math.round(Math.random() * 78));
      if (teleDown) teleDown.textContent = (1.2 + Math.random() * 8.2).toFixed(1);
    };
    setInterval(tick, 1700);
  }

  /* ======================================================= dashboard demo */

  var demo = $('[data-dashboard-demo]');
  if (demo) {
    var presetButtons = $$('[data-demo-preset]', demo);
    var presetPanels = $$('[data-demo-panel]', demo);
    var viewport = $('.live-panel__viewport', demo);
    var status = $('[data-demo-status]', demo);

    function selectPreset(key, announce) {
      var active = null;
      presetButtons.forEach(function (button) {
        var selected = button.getAttribute('data-demo-preset') === key;
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      presetPanels.forEach(function (panel) {
        var selected = panel.getAttribute('data-demo-panel') === key;
        panel.hidden = !selected;
        if (selected) active = panel;
      });
      if (!active) return;
      var label = active.getAttribute('data-demo-label') || '';
      if (viewport) viewport.setAttribute('aria-label', label);
      if (announce && status) status.textContent = label;
    }

    presetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selectPreset(button.getAttribute('data-demo-preset'), true);
      });
    });
  }
})();
