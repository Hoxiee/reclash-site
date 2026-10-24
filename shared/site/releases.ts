// GitHub releases for the download page: the bounded shape kept in memory and in the session cache,
// asset classification and the "best file for this device" score.

export const RELEASES_URL = 'https://api.github.com/repos/Hoxiee/ReClash/releases?per_page=10'
export const RELEASES_PAGE = 'https://github.com/Hoxiee/ReClash/releases'
export const RELEASE_REPO = 'Hoxiee/ReClash'
const MAX_RELEASES = 10, MAX_ASSETS = 60, MAX_BODY = 20000

export type ReleaseAsset = { name: string, size: number, url: string }
export type ReleaseInfo = { tag: string, name: string, prerelease: boolean, published: string, url: string, body: string, assets: ReleaseAsset[] }
export type Platform = { os: 'windows' | 'macos' | 'linux' | 'android', arch: string, kind: string }
export type Device = { os: string | null, arch: string }

const text = (value: unknown, max = 200) => typeof value === 'string' ? value.slice(0, max) : ''
const https = (value: unknown, fallback = '') => typeof value === 'string' && /^https:\/\//i.test(value) ? value.slice(0, 2000) : fallback
const record = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' ? value as Record<string, unknown> : null

/** Keeps only what the page shows from GitHub's release list: no drafts, capped counts and lengths. */
export function normalizeReleases(input: unknown): ReleaseInfo[] {
  if (!Array.isArray(input)) throw new Error('http')
  const releases: ReleaseInfo[] = []
  for (const value of input) {
    const raw = record(value)
    if (!raw || raw.draft === true) continue
    const tag = text(raw.tag_name, 120)
    const assets: ReleaseAsset[] = []
    for (const item of Array.isArray(raw.assets) ? raw.assets.slice(0, MAX_ASSETS) : []) {
      const asset = record(item)
      const url = https(asset?.browser_download_url)
      if (asset && url) assets.push({ name: text(asset.name), size: typeof asset.size === 'number' && asset.size >= 0 ? asset.size : 0, url })
    }
    releases.push({
      tag,
      name: text(raw.name) || tag,
      prerelease: raw.prerelease === true,
      published: text(raw.published_at, 40),
      url: https(raw.html_url, RELEASES_PAGE),
      body: text(raw.body, MAX_BODY),
      assets,
    })
    if (releases.length === MAX_RELEASES) break
  }
  return releases
}

/** Validates releases read back from the session cache; anything unexpected discards the cache. */
export function restoreReleases(input: unknown): ReleaseInfo[] | null {
  if (!Array.isArray(input) || input.length > MAX_RELEASES) return null
  const valid = input.every((value) => {
    const r = record(value)
    return !!r && typeof r.tag === 'string' && typeof r.name === 'string' && typeof r.prerelease === 'boolean'
      && typeof r.published === 'string' && typeof r.body === 'string' && r.body.length <= MAX_BODY && https(r.url) !== ''
      && Array.isArray(r.assets) && r.assets.length <= MAX_ASSETS
      && r.assets.every((a) => { const asset = record(a); return !!asset && typeof asset.name === 'string' && typeof asset.size === 'number' && https(asset.url) !== '' })
  })
  return valid ? input as ReleaseInfo[] : null
}

/** The release the download picker offers: the newest stable one, else the newest of any kind. */
export const currentRelease = (releases: ReleaseInfo[]) => releases.find(release => !release.prerelease) ?? releases[0]

export function releaseDate(iso: string, language: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function classify(name: string): Platform | null {
  const n = name.toLowerCase()
  if (/sha256|\.sig$|\.asc$|\.txt$|\.json$|\.ya?ml$|\.blockmap$/.test(n)) return null
  const os = /\.apk$|android/.test(n) ? 'android'
    : /\.dmg$|macos|darwin|\.pkg$/.test(n) ? 'macos'
    : /\.appimage$|\.deb$|\.rpm$|\.pkg\.tar|linux/.test(n) ? 'linux'
    : /\.exe$|\.msi$|windows|win(32|64)/.test(n) ? 'windows' : null
  if (!os) return null
  const arch = /arm64-v8a/.test(n) ? 'arm64-v8a' : /armeabi-v7a/.test(n) ? 'armeabi-v7a' : /universal/.test(n) ? 'universal'
    : /aarch64|arm64/.test(n) ? 'arm64' : /x86_64|amd64|x64/.test(n) ? (os === 'android' ? 'x86_64' : 'x64') : /i386|x86/.test(n) ? 'x86' : ''
  const kind = /\.exe$/.test(n) ? (/setup|install/.test(n) ? 'Installer' : 'Program') : /\.msi$/.test(n) ? 'Installer'
    : /\.zip$/.test(n) ? (os === 'windows' ? 'Portable ZIP' : 'ZIP') : /\.dmg$/.test(n) ? 'DMG' : /\.appimage$/.test(n) ? 'AppImage'
    : /\.deb$/.test(n) ? 'DEB' : /\.rpm$/.test(n) ? 'RPM' : /\.pkg\.tar/.test(n) ? 'pacman' : /\.apk$/.test(n) ? 'APK' : 'File'
  return { os, arch, kind }
}

type HighEntropy = { getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }> }

/** Browser-only: the visitor's OS and CPU family. Never waits more than a second for client hints. */
export async function detect(): Promise<Device> {
  const ua = navigator.userAgent
  const os = /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : /Mac/i.test(ua) ? 'macos' : /Win/i.test(ua) ? 'windows' : /Linux|X11/i.test(ua) ? 'linux' : null
  let arch = os === 'android' ? 'arm64-v8a' : 'x64'
  let wake = () => {}
  const timer = setTimeout(() => wake(), 1000)
  try {
    const hints = (navigator as Navigator & { userAgentData?: HighEntropy }).userAgentData?.getHighEntropyValues?.(['architecture', 'bitness'])
    const high = hints && await Promise.race([hints, new Promise<undefined>((resolve) => { wake = () => resolve(undefined) })])
    if (high?.architecture === 'arm') arch = 'arm64'
  } catch { /* Client hints are optional. */ } finally { clearTimeout(timer) }
  if (os === 'macos' && arch === 'x64') arch = ''  // Safari can't tell Apple silicon from Intel: don't guess
  return { os, arch }
}

export function score(asset: Platform, device: Device) {
  let s = 0
  if (asset.os !== device.os) return -1
  if (device.arch && asset.arch === device.arch) s += 4
  if (asset.arch === 'universal') s += 3
  if (!device.arch && device.os === 'macos' && asset.arch === 'arm64') s += 1
  if (asset.kind === 'Installer' || asset.kind === 'AppImage' || asset.kind === 'DMG' || asset.kind === 'APK') s += 2
  return s
}
