import type { ShallowRef } from 'vue'
import { pageMotionKey, type PageMotion } from './usePageMotion'

type Host = ReturnType<typeof import('../motion/runtime.js')['mountChrome']>
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/*
 * Mounts the site chrome once and a page scope for every rendered page. The first page waits
 * behind the loader; `html.is-ready` opens it and `html.is-loaded` removes it.
 */
export function useSiteMotion(root: Readonly<ShallowRef<HTMLElement | null>>) {
  const { t } = useText()
  const nuxtApp = useNuxtApp()
  const route = useRoute()
  const page = shallowRef<PageMotion>()
  provide(pageMotionKey, page)
  let host: Host | undefined
  let unmounted = false
  let pageRoot: Element | null = null

  function mountPage() {
    const element = root.value?.querySelector('#main > *') ?? null
    if (!host || element === pageRoot) return
    page.value?.scope.dispose()
    page.value = undefined
    pageRoot = element
    if (element) page.value = host.mountPage(element)
  }

  async function intro(html: HTMLElement) {
    const short = html.classList.contains('intro-short')
    const reduced = html.classList.contains('rm')
    const minimum = reduced ? 0 : short ? 520 : 1450
    await Promise.race([document.fonts?.ready, wait(1500)])
    await wait(Math.max(0, minimum - performance.now()))
    html.classList.add('is-ready')
    // page entrances start inside the opening glyph window
    await wait(reduced ? 0 : 120)
  }

  onMounted(async () => {
    const html = document.documentElement
    const { mountChrome } = await import('../motion/runtime.js')
    if (unmounted || !root.value) return
    host = mountChrome(root.value, t)
    const opened = intro(html)
    host.hold(opened)
    mountPage()
    await opened
    if (unmounted) return
    host.hold(Promise.resolve())
    setTimeout(() => html.classList.add('is-loaded'), html.classList.contains('rm') ? 200 : 1000)
  })

  const removeHook = nuxtApp.hook('page:finish', () => { mountPage() })
  watch(() => route.path, () => host?.chrome.route())
  onBeforeUnmount(() => {
    unmounted = true
    removeHook()
    page.value?.scope.dispose()
    host?.scope.dispose()
  })
}
