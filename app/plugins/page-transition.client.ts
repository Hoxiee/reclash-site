import { pageFromPath, languageFromPath } from '~~/shared/site/routes'

/*
 * Route changes run inside a same-document view transition: the old page recedes and the new
 * one opens as a circle from the pointer (or from the top for history and keyboard). The update
 * callback waits for `page:finish`, scrolls, then lets the browser capture the new state.
 * Reduced motion, hidden documents and browsers without the API swap pages instantly.
 */
type Pending = { finish: () => void, abort: () => void }
const keyOf = (path: string) => `${languageFromPath(path)}/${pageFromPath(path)}`

export default defineNuxtPlugin((nuxtApp) => {
  const html = document.documentElement
  const router = useRouter()
  let origin: { x: number, y: number } | null = null
  let pending: Pending | undefined
  let transition: ViewTransition | undefined
  let popstate = false

  window.addEventListener('pointerdown', (event) => {
    origin = { x: event.clientX, y: event.clientY }
  }, { capture: true, passive: true })
  window.addEventListener('keydown', () => { origin = null }, { capture: true, passive: true })
  window.addEventListener('popstate', (event) => {
    popstate = true
    // Swipe-back gestures already animate in some browsers; never animate twice.
    if ((event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) transition?.skipTransition()
  })

  router.beforeResolve((to, from) => {
    const fromHistory = popstate
    popstate = false
    if (!to.matched.length || keyOf(to.path) === keyOf(from.path)) return
    if (!document.startViewTransition || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    pending?.finish()
    const point = !fromHistory && origin ? origin : { x: innerWidth / 2, y: 0 }
    origin = null
    const radius = Math.hypot(Math.max(point.x, innerWidth - point.x), Math.max(point.y, innerHeight - point.y))
    html.style.setProperty('--vt-x', `${point.x}px`)
    html.style.setProperty('--vt-y', `${point.y}px`)
    html.style.setProperty('--vt-r', `${Math.ceil(radius) + 80}px`)
    html.dataset.vt = fromHistory ? 'back' : 'forward'

    let changeRoute!: () => void
    const ready = new Promise<void>(resolve => { changeRoute = resolve })
    const done = new Promise<void>((resolve, reject) => { pending = { finish: resolve, abort: reject } })
    const current = document.startViewTransition(() => { changeRoute(); return done })
    transition = current
    current.ready.catch(() => {})
    current.finished.catch(() => {}).finally(() => {
      if (transition !== current) return
      transition = undefined; pending = undefined
      delete html.dataset.vt
    })
    return ready
  })

  const abort = () => { pending?.abort(); pending = undefined }
  router.onError(abort)
  nuxtApp.hook('app:error', abort)
  nuxtApp.hook('vue:error', abort)
  // The new page is in the DOM; app/router.options.ts scrolls in the same task, before capture.
  nuxtApp.hook('page:finish', () => {
    pending?.finish()
    pending = undefined
  })
})
