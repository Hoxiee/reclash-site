import { createScope } from './scope'
import { createMotion } from './browser'
import { createTheme } from './theme'
import { createHelpers, initChrome, initSite } from './site'
import { initPages } from './pages'

/*
 * The chrome (nav, menu, footer, brand theme) mounts once per document and owns the frame
 * scheduler. Pages mount into child scopes that share it, so a route change disposes only
 * the page's springs, observers and listeners.
 */
export function mountChrome(root, t) {
  const scope = createScope(root)
  let gate = Promise.resolve()
  const M = createMotion(scope), Theme = createTheme(scope, M)
  /** @type {import('./types').PageHelpers} */
  const helpers = createHelpers(scope, M)
  M.installEasings()
  const chrome = initChrome(scope, M, Theme, t, helpers)
  const host = {
    scope, M, Theme, helpers, chrome,
    /** Page reveals wait for this promise, e.g. until the loader has opened. */
    hold(promise) { gate = promise },
    mountPage(pageRoot) {
      const pageScope = scope.child(pageRoot)
      const pageM = createMotion(pageScope, () => gate)
      /** @type {import('./types').PageHelpers} */
      const pageHelpers = { ...helpers }
      initSite(pageScope, pageM, Theme, t, pageHelpers)
      initPages(pageScope, pageM, Theme, t, pageHelpers)
      if (pageRoot.querySelector('.hero')) {
        import('./hero').then(({ initHero }) => {
          if (!pageScope.disposed) initHero(pageScope, pageM, Theme, t, pageHelpers)
        })
      }
      return { scope: pageScope, M: pageM, Theme, helpers: pageHelpers }
    },
  }
  return host
}
