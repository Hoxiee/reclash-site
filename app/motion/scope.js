import { createScheduler } from '../../shared/motion/core'

// Every browser resource belongs to the mounted document, including delayed work.
export function createScope(root) {
  let disposed = false
  const cleanup = [], timers = new Set(), animations = new Set()
  const controller = new AbortController()
  const scheduler = createScheduler({ request: fn => requestAnimationFrame(fn), cancel: id => cancelAnimationFrame(id) })
  const scope = {
    root, scheduler, signal: controller.signal,
    get disposed() { return disposed },
    own(fn) { cleanup.push(fn); return fn },
    listen(target, type, fn, options) {
      target.addEventListener(type, fn, options)
      cleanup.push(() => target.removeEventListener(type, fn, options))
    },
    timeout(fn, delay) {
      if (disposed) return 0
      const id = setTimeout(() => { timers.delete(id); if (!disposed) fn() }, delay)
      timers.add(id); return id
    },
    clearTimeout(id) { clearTimeout(id); timers.delete(id) },
    frame(fn) { return scheduler.tick(() => { if (!disposed) fn(); return false }) },
    observe(fn, options) {
      const io = new IntersectionObserver(entries => { if (!disposed) fn(entries) }, options)
      cleanup.push(() => io.disconnect()); return io
    },
    animate(el, frames, options) {
      if (disposed) return
      const animation = el.animate(frames, options)
      animations.add(animation)
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation))
      return animation
    },
    dispose() {
      disposed = true; controller.abort(); scheduler.dispose()
      for (const id of timers) clearTimeout(id)
      for (const animation of animations) animation.cancel()
      for (const fn of cleanup.reverse()) fn()
      root.querySelectorAll('.mg-ind, .slot-measure, .slot-out').forEach(el => el.remove())
      document.documentElement.classList.remove('js', 'rm', 'menu-open')
      document.documentElement.style.removeProperty('overflow')
    },
  }
  scope.listen(document, 'visibilitychange', () => scheduler.pause(document.hidden))
  scheduler.pause(document.hidden)
  return scope
}
