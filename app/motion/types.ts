import type * as core from '../../shared/motion/core'
export type Magnet = { el: HTMLElement, select: (element: Element | null) => void, refresh: () => void }
export type BrowserMotion = typeof core & {
  reduced: boolean,
  spring: (value?: number, options?: core.SpringOptions) => core.Spring,
  tick: (job: core.FrameJob) => () => void,
  onReduced: (job: (reduced: boolean) => void) => () => void,
  whenReady: () => Promise<void>,
  installEasings: (names?: core.Preset[]) => void,
  write: (key: string, job: () => void) => void,
  magnetGroup: (element: Element, options?: Record<string, unknown>) => Magnet,
  morph: (element: Element, preset?: core.Preset) => { to: (path: string) => void },
  splitWords: (element: Element) => Element,
  reveal: (elements: string | Element[], job?: (element: Element) => void, options?: Record<string, unknown>) => void,
  onScroll: (job: (position: number) => void) => void,
}
export type PageHelpers = {
  copyText: (text: string) => Promise<boolean>,
  morphWidth: (element: HTMLElement, mutate: () => void) => void,
  hero?: { wobble: (strength?: number, angle?: number) => void },
}
