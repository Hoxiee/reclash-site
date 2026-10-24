import { createScheduler } from '../../shared/motion/core'

// Every browser resource belongs to a scope. The site chrome owns the only frame scheduler;
// each mounted page gets a child scope that shares it and releases its own jobs on dispose.
function makeScope(root, scheduler, onDispose) {
  let disposed = false
  const cleanup = [], timers = new Set(), animations = new Set(), children = new Set()
  const controller = new AbortController()
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
    child(childRoot) {
      const jobs = new Set()
      const shared = {
        tick(job) {
          const stop = scheduler.tick((dt, time) => {
            const result = job(dt, time)
            if (result === false) jobs.delete(release)
            return result
          })
          const release = () => { jobs.delete(release); stop() }
          jobs.add(release); return release
        },
        pause: scheduler.pause,
        dispose() { for (const release of [...jobs]) release() },
      }
      const sub = makeScope(childRoot, shared, () => { shared.dispose(); children.delete(sub) })
      children.add(sub)
      return sub
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const sub of [...children]) sub.dispose()
      controller.abort(); onDispose()
      for (const id of timers) clearTimeout(id)
      for (const animation of animations) animation.cancel()
      for (const fn of cleanup.reverse()) fn()
      cleanup.length = 0
      root.querySelectorAll('.mg-ind, .slot-measure, .slot-out').forEach(el => el.remove())
    },
  }
  return scope
}

export function createScope(root) {
  const scheduler = createScheduler({ request: fn => requestAnimationFrame(fn), cancel: id => cancelAnimationFrame(id) })
  const scope = makeScope(root, scheduler, () => {
    scheduler.dispose()
    document.documentElement.classList.remove('menu-open')
    document.documentElement.style.removeProperty('overflow')
  })
  scope.listen(document, 'visibilitychange', () => scheduler.pause(document.hidden))
  scheduler.pause(document.hidden)
  return scope
}
