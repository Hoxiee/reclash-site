import type { InjectionKey, ShallowRef } from 'vue'
export type PageMotion = ReturnType<ReturnType<typeof import('../motion/runtime.js')['mountChrome']>['mountPage']>
export const pageMotionKey: InjectionKey<ShallowRef<PageMotion | undefined>> = Symbol('page-motion')
/** The current page's motion runtime; it changes on every route and is undefined until mounted. */
export const usePageMotion = () => inject(pageMotionKey, shallowRef<PageMotion>())
