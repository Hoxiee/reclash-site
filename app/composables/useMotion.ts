import type { ShallowRef } from 'vue'
import { pageMotionKey } from './usePageMotion'

export function useMotion(root: Readonly<ShallowRef<HTMLElement | null>>) {
  const { t } = useText()
  let unmounted = false
  const runtime = shallowRef<ReturnType<typeof import('../motion/runtime.js')['mountMotion']>>()
  provide(pageMotionKey, runtime)
  onMounted(async () => {
    const { mountMotion } = await import('../motion/runtime.js')
    if (unmounted || !root.value) return
    runtime.value = mountMotion(root.value, t)
  })
  onBeforeUnmount(() => { unmounted = true; runtime.value?.scope.dispose() })
}
