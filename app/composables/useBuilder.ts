import type { InjectionKey, Ref } from 'vue'
import { getAt, setAt, splitPath, type Manifest } from '~~/shared/provider/builder/document'
import type { Issue } from '~~/shared/provider/builder/validate'

export type BuilderContext = {
  manifest: Manifest
  issues: Ref<Map<string, Issue[]>>
  /** The path the preview asked to reveal; sections and cards open for it. */
  reveal: Ref<{ path: string, at: number } | undefined>
  /** The app parser's warnings for the current file, verbatim; empty until it has run. */
  warnings: Ref<string[]>
}

export const builderKey: InjectionKey<BuilderContext> = Symbol('builder')

export function useBuilder() {
  const context = inject(builderKey)!
  const get = (path: string) => getAt(context.manifest, splitPath(path))
  const set = (path: string, value: unknown) => setAt(context.manifest, splitPath(path), value)
  const issuesAt = (path: string, deep = false) => {
    if (!deep) return context.issues.value.get(path) ?? []
    return [...context.issues.value].filter(([key]) => key === path || key.startsWith(`${path}.`)).flatMap(([, list]) => list)
  }
  return { ...context, get, set, issuesAt }
}

export const fieldId = (path: string) => `bf-${path.replace(/[^\w-]/g, '-')}`

let kernel: Promise<ReclashKernel | null> | undefined
export type ReclashKernel = { parse: (yaml: string, locale: string) => string }
export type KernelResult = { ok: boolean, warnings: string[] }
export type KernelView = { state: 'idle' | 'loading' | 'unavailable' } | { state: 'done', result: KernelResult, stale: boolean }

/** The app's own manifest parser compiled to JS; a classic script outside the route bundle. */
export function loadKernel(): Promise<ReclashKernel | null> {
  const current = () => {
    const value = (globalThis as { reclashKernel?: ReclashKernel }).reclashKernel
    return typeof value?.parse === 'function' ? value : null
  }
  const ready = current()
  if (ready) return Promise.resolve(ready)
  kernel ??= new Promise(resolve => {
    const script = document.createElement('script')
    const timeout = setTimeout(() => finish(null), 10_000)
    function finish(result: ReclashKernel | null) {
      clearTimeout(timeout)
      script.onload = null
      script.onerror = null
      if (!result) { script.remove(); kernel = undefined }
      resolve(result)
    }
    script.src = '/runtime/kernel.js'
    script.async = true
    script.onload = () => finish(current())
    script.onerror = () => finish(null)
    document.head.append(script)
  })
  return kernel
}
