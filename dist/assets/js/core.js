/* Shared behaviour for every page. Everything degrades to plain HTML. */
(function () {
  'use strict';

  var d = document;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) { return (root || d).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }

  window.RC = { $: $, $$: $$, reduced: reduced };

  /* ------------------------------------------------------------ masthead */

  var head = $('.masthead');
  var burger = $('.burger');
  if (head && burger) {
    burger.addEventListener('click', function () {
      var open = head.getAttribute('data-open') === 'true';
      head.setAttribute('data-open', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    $$('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        head.setAttribute('data-open', 'false');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* -------------------------------------------- remember language choice */

  $$('.lang a').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('rc-lang', a.getAttribute('data-lang')); } catch (e) {}
    });
  });

  /* --------------------------------------------- scroll progress + shadow
     One scroll listener drives both the reading-progress rail under the
     masthead and the bar's own "scrolled" state. rAF-throttled so a fast
     wheel does not queue a layout on every tick. */

  if (head) {
    var progress = $('.masthead__progress span');
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.pageYOffset || d.documentElement.scrollTop || 0;
        var max = d.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(1, y / max) : 0;
        if (progress) progress.style.setProperty('--progress', p.toFixed(4));
        head.setAttribute('data-scrolled', y > 8 ? 'true' : 'false');
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------- cursor aura
     A soft light that trails the pointer, only where there is a fine pointer
     to trail. It eases towards the cursor and swells over interactive targets.
     No aura element is created at all under reduced-motion or on touch, so the
     loop below never runs there. */

  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduced) {
    var aura = d.createElement('div');
    aura.className = 'aura';
    aura.setAttribute('aria-hidden', 'true');
    d.body.appendChild(aura);

    var ax = window.innerWidth / 2, ay = window.innerHeight / 2;
    var tx = ax, ty = ay, asc = 1, tsc = 1;

    function auraMove(e) {
      tx = e.clientX; ty = e.clientY;
      aura.style.opacity = '0.55';
      var el = e.target;
      tsc = el && el.closest && el.closest("a,button,input,select,textarea,summary,[role='button'],[tabindex]")
        ? 1.25 : 1;
    }
    function auraLeave() { aura.style.opacity = '0'; }
    function auraLoop() {
      ax += (tx - ax) * 0.15;
      ay += (ty - ay) * 0.15;
      asc += (tsc - asc) * 0.12;
      aura.style.transform = 'translate3d(' + ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px,0) scale(' + asc.toFixed(3) + ')';
      requestAnimationFrame(auraLoop);
    }
    window.addEventListener('pointermove', auraMove, { passive: true });
    d.addEventListener('pointerleave', auraLeave);
    requestAnimationFrame(auraLoop);
  }

  /* --------------------------------------------- pointer-tracked card glow
     Interactive surfaces track the cursor as an (x, y) pair on the element, so
     a highlight can bloom under the pointer. Pure custom properties — the CSS
     decides what to do with them, and it costs nothing where the rule is absent. */

  var glowables = $$('[data-glow]');
  if (glowables.length && finePointer) {
    glowables.forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ------------------------------------------------------------- reveals */

  var revealables = $$('.reveal');
  if (revealables.length) {
    if (!('IntersectionObserver' in window) || reduced) {
      revealables.forEach(function (el) { el.classList.add('is-static'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var delay = parseFloat(el.getAttribute('data-delay') || '0');
          setTimeout(function () { el.classList.add('is-in'); }, delay * 1000);
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------- copy to clipboard */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = d.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      d.body.appendChild(ta);
      ta.select();
      try { d.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      d.body.removeChild(ta);
    });
  }
  window.RC.copyText = copyText;

  function wireCopy(btn) {
    if (btn.__wired) return;
    btn.__wired = true;
    var label = btn.textContent;
    var done = btn.getAttribute('data-done-label') || 'ok';
    btn.addEventListener('click', function () {
      var src;
      var sel = btn.getAttribute('data-copy');
      if (sel) {
        var target = d.querySelector(sel);
        src = target ? (target.value !== undefined && target.tagName === 'TEXTAREA' ? target.value : target.textContent) : '';
      } else {
        var box = btn.closest('.codeblock');
        var pre = box && box.querySelector('pre');
        src = pre ? pre.textContent : '';
      }
      copyText(src).then(function () {
        btn.textContent = done;
        btn.setAttribute('data-done', 'true');
        setTimeout(function () {
          btn.textContent = label;
          btn.removeAttribute('data-done');
        }, 1600);
      }).catch(function () {
        btn.textContent = '×';
        setTimeout(function () { btn.textContent = label; }, 1600);
      });
    });
  }
  $$('.copy').forEach(wireCopy);
  window.RC.wireCopy = wireCopy;

  /* ----------------------------------------------------------------- tabs */

  $$('[data-tabs]').forEach(function (group) {
    var buttons = $$('[role="tab"]', group);
    function select(idx) {
      buttons.forEach(function (b, i) {
        var on = i === idx;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        var panel = d.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }
    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (ev) {
        var next = ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : -1;
        if (next < 0 || next >= buttons.length) return;
        ev.preventDefault();
        buttons[next].focus();
        select(next);
      });
    });
    select(Math.max(0, buttons.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; })));
  });

  /* ------------------------------------------------------------------ FAQ */

  $$('.faq__q').forEach(function (q) {
    var panel = d.getElementById(q.getAttribute('aria-controls'));
    if (!panel) return;
    panel.setAttribute('data-open', q.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.setAttribute('data-open', open ? 'false' : 'true');
    });
  });

  function openFromHash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var target = d.getElementById(id);
    if (!target) return;
    var panel = target.classList && target.classList.contains('faq__a') ? target : target.querySelector('.faq__a');
    if (!panel) return;
    var q = d.querySelector('[aria-controls="' + panel.id + '"]');
    if (q) { q.setAttribute('aria-expanded', 'true'); panel.setAttribute('data-open', 'true'); }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ------------------------------------------------------- doc navigation */

  var toc = $('.toc');
  if (toc) {
    var links = $$('a[href^="#"]', toc);
    var sections = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      var visible = new Set();
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id);
        });
        var firstId = null;
        for (var i = 0; i < sections.length; i++) {
          if (visible.has(sections[i].id)) { firstId = sections[i].id; break; }
        }
        links.forEach(function (a) {
          var on = firstId && a.getAttribute('href') === '#' + firstId;
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
      sections.forEach(function (s) { spy.observe(s); });
    }

    var search = $('.toc__search', toc);
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        $$('li', toc).forEach(function (li) {
          var text = (li.textContent + ' ' + (li.getAttribute('data-keys') || '')).toLowerCase();
          li.hidden = q.length > 0 && text.indexOf(q) === -1;
        });
      });
    }
  }

  /* ------------------------------------------------- heading anchor links */

  $$('.doc__body h2[id]').forEach(function (h) {
    if ($('.anchor', h)) return;
    var a = d.createElement('a');
    a.className = 'anchor';
    a.href = '#' + h.id;
    a.textContent = '#';
    a.setAttribute('aria-label', 'link');
    h.appendChild(a);
  });

  /* ------------------------------------------------- scrollable list fades
     A box that clips its content should say so at the end that still has
     something behind it, and stop saying it once you get there. */
  $$('[data-fade]').forEach(function (box) {
    function mark() {
      var room = box.scrollHeight - box.clientHeight;
      if (room <= 2) return box.setAttribute('data-fade', 'none');
      var top = box.scrollTop > 2;
      var end = box.scrollTop < room - 2;
      box.setAttribute('data-fade', top && end ? 'both' : top ? 'top' : 'end');
    }
    box.addEventListener('scroll', mark, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(mark).observe(box);
    mark();
  });

  /* ------------------------------------------------- sideways code cues
     `pre` already carries a scroll-shadow, but that is a background tint and
     the text is painted opaque on top of it: a long snippet still gets sliced
     mid-character with nothing to say so. The cue has to sit above the text,
     which means an overlay on the non-scrolling parent. */
  $$('.codeblock > pre').forEach(function (pre) {
    var box = pre.parentNode;
    function mark() {
      var room = pre.scrollWidth - pre.clientWidth;
      if (room <= 2) return box.setAttribute('data-x', 'none');
      var start = pre.scrollLeft > 2;
      var end = pre.scrollLeft < room - 2;
      box.setAttribute('data-x', start && end ? 'both' : start ? 'start' : 'end');
    }
    pre.addEventListener('scroll', mark, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(mark).observe(pre);
    /* the builder rewrites its panes on every keystroke */
    if (window.MutationObserver) {
      new MutationObserver(mark).observe(pre, { childList: true, subtree: true, characterData: true });
    }
    mark();
  });

  /* --------------------------------------------------- import-link builder
     The strings live on the element because this file is shared by both
     languages; the markup comes out of gen/ui.py, which knows which one. */
  $$('.deeplink').forEach(function (dl) {
    var inp = $('input', dl);
    var out = $('.deeplink__out', dl);
    var msg = $('.deeplink__msg', dl);
    var mk = $('[data-make]', dl);
    if (!inp || !out || !mk) return;

    var scheme = dl.getAttribute('data-scheme') || 'reclash';
    var sampleUrl = dl.getAttribute('data-sample-url') || '';
    var label = mk.textContent;
    var doneLabel = mk.getAttribute('data-done-label') || label;
    var timer = null;

    function str(key) { return dl.getAttribute('data-msg-' + key) || ''; }

    function say(key, tone) {
      msg.textContent = str(key);
      msg.setAttribute('data-tone', tone);
    }

    function restore() {
      mk.textContent = label;
      mk.removeAttribute('data-done');
    }

    /* A subscription link is an absolute http(s) URL with a host. Anything
       else — a bare token, a note to self, a half-typed address — would be
       encoded into a deeplink that silently leads nowhere. */
    function valid(raw) {
      if (!/^https?:\/\//i.test(raw)) return false;
      try { return !!new URL(raw).hostname; } catch (e) { return false; }
    }

    function link(raw) {
      return scheme + '://install-config?url=' + encodeURIComponent(raw);
    }

    /* strict is false while typing: half an address is not yet a mistake. */
    function build(strict) {
      var raw = inp.value.trim();
      if (!raw) {
        dl.setAttribute('data-state', 'sample');
        out.textContent = link(sampleUrl);
        say('sample', 'info');
        return false;
      }
      if (!valid(raw)) {
        /* Half a typed address is not yet a mistake, but it is not a link
           either: show nothing rather than a cyan deeplink to nowhere. */
        dl.setAttribute('data-state', strict ? 'bad' : 'idle');
        out.textContent = '';
        if (strict) say('bad', 'bad');
        else { msg.textContent = ''; msg.setAttribute('data-tone', 'info'); }
        return false;
      }
      dl.setAttribute('data-state', 'ok');
      out.textContent = link(raw);
      say('ready', 'info');
      return true;
    }

    inp.addEventListener('input', function () {
      clearTimeout(timer);
      restore();
      build(false);
    });
    inp.addEventListener('blur', function () { build(true); });

    mk.addEventListener('click', function () {
      clearTimeout(timer);
      restore();
      /* copying the sample would hand over a link to nowhere */
      if (!build(true)) { inp.focus(); return; }
      copyText(out.textContent).then(function () {
        mk.textContent = doneLabel;
        mk.setAttribute('data-done', 'true');
        say('done', 'done');
        timer = setTimeout(function () {
          restore();
          say('ready', 'info');
        }, 2400);
      }).catch(function () {
        say('fail', 'fail');
      });
    });

    build(false);
  });

  /* --------------------------------------------------- header catalogue
     Search + category filter over the reference cards. Every card is an open
     <details> in the markup, so with no JS the whole catalogue reads as plain
     sections; this only hides what does not match and opens matches so you see
     why they matched. */
  var catalog = $('[data-catalog]');
  if (catalog) {
    var input = $('.catalog__input', catalog);
    var filters = $$('.hfilter', catalog);
    var cards = $$('.hcard', catalog);
    var groups = $$('.hgroup', catalog);
    var empty = $('.catalog__empty', catalog);
    var cat = 'all';

    /* Cards start collapsed once JS is in; without JS they stay open. */
    cards.forEach(function (c) { c.open = false; });

    function apply() {
      var q = (input ? input.value : '').trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var okCat = cat === 'all' || c.getAttribute('data-cat') === cat;
        var hay = (c.getAttribute('data-name') + ' ' +
          (c.getAttribute('data-keys') || '') + ' ' +
          c.textContent).toLowerCase();
        var okQ = !q || hay.indexOf(q) !== -1;
        var on = okCat && okQ;
        c.hidden = !on;
        /* Open matches while searching so the reason is visible; leave them
           as the user left them once the query is cleared. */
        if (q && on) c.open = true;
        if (on) shown++;
      });
      /* Hide a group whose every card is filtered out. */
      groups.forEach(function (g) {
        var any = $$('.hcard', g).some(function (c) { return !c.hidden; });
        g.hidden = !any;
      });
      if (empty) empty.hidden = shown !== 0;
    }

    if (input) {
      input.addEventListener('input', apply);
      /* Escape clears the field, the way a search box should. */
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { input.value = ''; apply(); }
      });
    }
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        cat = b.getAttribute('data-cat') || 'all';
        filters.forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        apply();
      });
    });

    /* Deep link: /reference.html#h-reclash-hex opens and reveals that card. */
    function openFromHashCard() {
      var id = location.hash.slice(1);
      if (!id) return;
      var card = d.getElementById(id);
      if (card && card.classList.contains('hcard')) {
        card.hidden = false;
        card.open = true;
        card.scrollIntoView({ block: 'center' });
      }
    }
    openFromHashCard();
    window.addEventListener('hashchange', openFromHashCard);

    apply();
  }

  /* ------------------------------------------------- page-transition direction
     Cross-document View Transitions do the swap (CSS opts in with
     `@view-transition`). Here we only *label* each transition so the stylesheet
     can pick a direction: `forward`/`back` along the nav order, or `lang` for
     the language switch — same page, other tongue. `pageswap` fires on the page
     being left, `pagereveal` on the one arriving; both must tag it, because the
     type lives on each document's own transition. No API, no tags — the swap is
     just the browser default, and the CSS default animation still applies. */
  if ('addEventListener' in window) {
    /* Nav order = reading order of the masthead links, mock/reference folded in
       under their parent. Index decides which way a jump travels. */
    var VT_ORDER = ['index', 'gallery', 'start', 'docs', 'reference', 'builder',
      'mock', 'download'];
    function vtFile(name) { return name.replace(/^.*\//, '').replace(/[?#].*$/, ''); }
    function vtKey(file) {
      var f = vtFile(file);
      var i = f.lastIndexOf('.html');
      return i === -1 ? f : f.slice(0, i);
    }
    function vtLang(path) {
      var m = path.match(/\/(ru|en)\//);
      return m ? m[1] : '';
    }
    function vtTypes(fromURL, toURL) {
      var types = [];
      try {
        var from = new URL(fromURL, location.href);
        var to = new URL(toURL, location.href);
        if (to.origin !== from.origin) return types;
        var fl = vtLang(from.pathname), tl = vtLang(to.pathname);
        var fk = vtKey(from.pathname), tk = vtKey(to.pathname);
        if (fl && tl && fl !== tl && fk === tk) {
          types.push('lang');            /* same page, switched language */
        } else if (fk !== tk) {
          var a = VT_ORDER.indexOf(fk), b = VT_ORDER.indexOf(tk);
          if (a !== -1 && b !== -1) types.push(b > a ? 'forward' : 'back');
          else types.push('forward');    /* unknown page — treat as advancing */
        }
      } catch (e) {}
      return types;
    }
    function vtApply(vt, types) {
      if (vt && vt.types && types.length) {
        types.forEach(function (t) { try { vt.types.add(t); } catch (e) {} });
      }
    }
    window.addEventListener('pageswap', function (e) {
      if (!e.viewTransition || !e.activation || !e.activation.entry) return;
      vtApply(e.viewTransition,
        vtTypes(location.href, e.activation.entry.url));
    });
    window.addEventListener('pagereveal', function (e) {
      if (!e.viewTransition) return;
      var nav = window.navigation;
      var from = nav && nav.activation && nav.activation.from
        ? nav.activation.from.url : d.referrer;
      if (from) vtApply(e.viewTransition, vtTypes(from, location.href));
    });
    /* No leave-side interception here on purpose. On engines without native
       cross-document View Transitions (Firefox, older Safari) the only way to
       hide the inter-document gap is to hold the old frame — i.e. delay the
       navigation behind an exit animation — and that delay makes every click
       feel laggy, which is worse than the brief gap it hides. So those engines
       just navigate instantly; the arriving page still eases in via the CSS
       `page-enter` fallback, which costs the click nothing. */
  }
})();
