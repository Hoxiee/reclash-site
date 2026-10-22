import { createScope } from './scope'
import { createMotion } from './browser'
import { createTheme } from './theme'
import { initSite } from './site'
import { initPages } from './pages'

export function mountMotion(root, t) {
  const scope = createScope(root)
  const M = createMotion(scope), Theme = createTheme(scope, M)
  /** @type {import('./types').PageHelpers} */
  const helpers = {}
  document.documentElement.classList.add('js')
  initSite(scope, M, Theme, t, helpers)
  initPages(scope, M, Theme, t, helpers)
  if (root.querySelector('.hero')) {
    import('./hero').then(({ initHero }) => {
      if (!scope.disposed) initHero(scope, M, Theme, t, helpers)
    })
  }
  return { scope, M, Theme, helpers }
}
