/* Mock-subscription detail modals.

   Progressive enhancement over a plain :target overlay. The triggers are
   <a href="#m-key"> and each modal is shown by `.mockmodal:target` in CSS, so
   with no JavaScript a click still opens the panel and the scrim link closes
   it. Here we take over: open without touching the hash (no history spam),
   trap nothing heavy but move focus in and back out, lock the background
   scroll, and close on Escape, on the scrim, or on the × button. */
(function () {
  'use strict';

  var d = document;
  var $$ = (window.RC && window.RC.$$) ||
    function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  var modals = $$('.mockmodal');
  if (!modals.length) return;

  var open = null;      // the modal element currently shown
  var opener = null;    // the trigger to restore focus to on close

  function lock(on) {
    d.documentElement.style.overflow = on ? 'hidden' : '';
    d.body.style.overflow = on ? 'hidden' : '';
  }

  function openModal(m, trigger) {
    if (open) closeModal();
    open = m;
    opener = trigger || null;
    m.classList.add('is-open');
    lock(true);
    var focusable = m.querySelector('.mockmodal__x');
    if (focusable) focusable.focus();
  }

  function closeModal() {
    if (!open) return;
    open.classList.remove('is-open');
    open = null;
    lock(false);
    if (opener && opener.focus) opener.focus();
    opener = null;
  }

  $$('[data-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      var m = d.getElementById(trigger.getAttribute('data-modal'));
      if (!m) return;                 /* let the href fall through */
      e.preventDefault();
      openModal(m, trigger);
    });
  });

  modals.forEach(function (m) {
    /* the scrim and the × both close; the scrim is a link for the no-JS case */
    $$('.mockmodal__scrim, [data-close]', m).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        closeModal();
      });
    });
    /* a click that lands on the modal backdrop itself (not the panel) closes */
    m.addEventListener('mousedown', function (e) {
      if (e.target === m) closeModal();
    });
  });

  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) closeModal();
  });
})();
