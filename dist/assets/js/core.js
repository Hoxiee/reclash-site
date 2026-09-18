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
})();
