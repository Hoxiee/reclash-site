import { currentRelease, normalizeReleases, restoreReleases, RELEASES_URL, type ReleaseInfo } from '~~/shared/site/releases'

export type ReleaseFailure = 'rate' | 'http' | 'none'
export type ReleaseFeed =
  | { status: 'loading' }
  | { status: 'error', failure: ReleaseFailure }
  | { status: 'ready', releases: ReleaseInfo[], current: ReleaseInfo }

const cacheKey = 'reclash-releases', cacheVersion = 2, cacheTime = 600000, timeout = 15000

function readCache() {
  try {
    sessionStorage.removeItem('reclash-release')  // the single-release cache of the previous page
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
    if (cached?.v === cacheVersion && typeof cached.at === 'number' && Date.now() - cached.at < cacheTime && Date.now() >= cached.at) return restoreReleases(cached.data)
  } catch { /* Storage is optional. */ }
  return null
}

function writeCache(releases: ReleaseInfo[]) {
  try { sessionStorage.setItem(cacheKey, JSON.stringify({ v: cacheVersion, at: Date.now(), data: releases })) } catch { /* Storage is optional. */ }
}

const settle = (releases: ReleaseInfo[]): ReleaseFeed => {
  const current = currentRelease(releases)
  return current ? { status: 'ready', releases, current } : { status: 'error', failure: 'none' }
}

/**
 * The download page's release list: one GitHub request per ten minutes and tab, started after
 * mount and aborted on unmount or after a timeout, so the page never waits on it forever.
 */
export function useReleases() {
  const feed = shallowRef<ReleaseFeed>({ status: 'loading' })
  let controller: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  onMounted(async () => {
    const cached = readCache()
    if (cached) { feed.value = settle(cached); return }
    controller = new AbortController()
    timer = setTimeout(() => controller?.abort(), timeout)
    try {
      const response = await fetch(RELEASES_URL, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal })
      if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'rate' : 'http')
      const releases = normalizeReleases(await response.json())
      if (disposed) return
      writeCache(releases)
      feed.value = settle(releases)
    } catch (error) {
      if (!disposed) feed.value = { status: 'error', failure: error instanceof Error && error.message === 'rate' ? 'rate' : 'http' }
    } finally { clearTimeout(timer) }
  })
  onBeforeUnmount(() => { disposed = true; clearTimeout(timer); controller?.abort() })
  return computed(() => feed.value)
}
