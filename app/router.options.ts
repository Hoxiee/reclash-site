import type { RouterConfig } from '@nuxt/schema'

// Anchors land below the fixed nav: honour scroll-margin-top and the root scroll-padding-top.
function hashOffset(hash: string) {
  const element = document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!element) return 0
  return (Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0)
    + (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
}

// Scrolls as soon as the new page is rendered, so a view transition captures the final position.
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const samePage = to.path.replace(/(?:\.html|\/)$/, '') === from.path.replace(/(?:\.html|\/)$/, '')
    const target = () => savedPosition
      ?? (to.hash ? { el: to.hash, top: hashOffset(to.hash), behavior: samePage ? 'smooth' as const : 'instant' as const } : { left: 0, top: 0 })
    if (samePage) return to.hash ? target() : false
    if (!from.matched.length) return target()
    return new Promise(resolve => useNuxtApp().hooks.hookOnce('page:finish', () => resolve(target())))
  },
}
