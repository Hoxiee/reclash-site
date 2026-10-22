import type { InjectionKey, ShallowRef } from 'vue'
type PageMotion = ReturnType<typeof import('../motion/runtime.js')['mountMotion']>
export const pageMotionKey: InjectionKey<ShallowRef<PageMotion | undefined>> = Symbol('page-motion')
export const usePageMotion = () => inject(pageMotionKey, shallowRef<PageMotion>())
