export const clamp = (v: number, a: number, b: number) => v < a ? a : v > b ? b : v
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1)
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const easeOut = (t: number) => 1 - (1 - t) ** 3
export const presets = {
  gentle: { stiffness: 120, damping: 22 },
  smooth: { stiffness: 230, damping: 30 },
  snappy: { stiffness: 440, damping: 38 },
  bouncy: { stiffness: 320, damping: 17 },
  jelly: { stiffness: 240, damping: 11 },
  scroll: { stiffness: 280, damping: 38 },
} as const
export type Preset = keyof typeof presets
export type FrameJob = (dt: number, time: number) => void | boolean
export type FrameDriver = { request: (job: (time: number) => void) => number, cancel: (id: number) => void }

// The driver is supplied by the browser adapter; importing the core has no side effects.
export function createScheduler(driver: FrameDriver) {
  const jobs = new Set<FrameJob>()
  let frameId = 0, last = 0, paused = false
  function request() { if (!paused && !frameId && jobs.size) frameId = driver.request(frame) }
  function frame(time: number) {
    frameId = 0
    let dt = (time - last) / 1000
    last = time
    if (!(dt > 0) || dt > 0.1) dt = 1 / 60
    for (const job of [...jobs]) if (jobs.has(job) && job(dt, time) === false) jobs.delete(job)
    request()
  }
  return {
    tick(job: FrameJob) {
      jobs.add(job); request()
      return () => {
        jobs.delete(job)
        if (!jobs.size && frameId) { driver.cancel(frameId); frameId = 0 }
      }
    },
    pause(value: boolean) {
      paused = value; last = 0
      if (paused && frameId) { driver.cancel(frameId); frameId = 0 }
      request()
    },
    dispose() { jobs.clear(); if (frameId) driver.cancel(frameId); frameId = 0 },
  }
}
export type Scheduler = ReturnType<typeof createScheduler>
export type SpringOptions = {
  preset?: Preset, stiffness?: number, damping?: number, mass?: number, precision?: number,
  onUpdate?: (value: number, velocity: number) => void, onRest?: (value: number) => void,
}
export class Spring {
  x: number
  v = 0
  target: number
  running = false
  k = 230
  c = 30
  m = 1
  eps = 0.01
  onUpdate: SpringOptions['onUpdate']
  onRest: SpringOptions['onRest']
  private stop?: () => void
  constructor(value: number, private scheduler: Scheduler, private reduced: () => boolean, opts: SpringOptions = {}) {
    this.x = this.target = value
    this.onUpdate = opts.onUpdate; this.onRest = opts.onRest
    this.config(opts)
  }
  config(opts: SpringOptions = {}) {
    const p = opts.preset ? presets[opts.preset] : opts
    this.k = p.stiffness ?? this.k; this.c = p.damping ?? this.c
    this.m = opts.mass ?? this.m; this.eps = opts.precision ?? this.eps
    return this
  }
  to(target: number, opts?: SpringOptions) {
    if (opts) this.config(opts)
    this.target = target
    if (this.reduced()) return this.set(target)
    if (!this.running && Math.abs(this.x - target) < this.eps && Math.abs(this.v) < this.eps) return this
    this.run(); return this
  }
  set(value: number) {
    this.stop?.(); this.stop = undefined; this.running = false
    this.x = this.target = value; this.v = 0
    this.onUpdate?.(value, 0)
    return this
  }
  kick(dv: number) { if (!this.reduced()) { this.v += dv; this.run() }; return this }
  private run() {
    if (this.running) return
    this.running = true
    this.stop = this.scheduler.tick(dt => this.step(dt))
  }
  private step(dt: number) {
    if (this.reduced()) { this.set(this.target); return false }
    const n = Math.ceil(dt * 240), h = dt / n
    for (let i = 0; i < n; i++) {
      this.v += (-this.k * (this.x - this.target) - this.c * this.v) / this.m * h
      this.x += this.v * h
    }
    const done = Math.abs(this.v) < this.eps && Math.abs(this.x - this.target) < this.eps
    if (done) { this.x = this.target; this.v = 0 }
    this.onUpdate?.(this.x, this.v)
    if (done) { this.running = false; this.stop = undefined; this.onRest?.(this.x); return false }
  }
  dispose() { this.stop?.(); this.stop = undefined; this.running = false }
}
export function cssEase(preset: Preset | { stiffness: number, damping: number }, samples = 56) {
  const p = typeof preset === 'string' ? presets[preset] : preset
  const h = 1 / 1200, out: number[][] = [[0, 0]]
  let x = 0, v = 0, t = 0
  while (t < 3) {
    for (let i = 0; i < 10; i++) { v += (-p.stiffness * (x - 1) - p.damping * v) * h; x += v * h; t += h }
    out.push([t, x])
    if (Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.02) break
  }
  const stride = Math.max(1, Math.round(out.length / samples)), points: number[][] = []
  for (let i = 0; i < out.length; i += stride) points.push(out[i]!)
  points.push([t, 1])
  return {
    easing: `linear(${points.map(([tt, xx]) => `${+xx!.toFixed(4)} ${+((tt! / t) * 100).toFixed(2)}%`).join(', ')})`,
    duration: Math.round(t * 1000),
  }
}
export function blobPath(cx: number, cy: number, radii: ArrayLike<number>, rot = -Math.PI / 2) {
  const n = radii.length, px = new Float32Array(n), py = new Float32Array(n)
  for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; px[i] = cx + Math.cos(a) * radii[i]!; py[i] = cy + Math.sin(a) * radii[i]! }
  const f = (v: number) => v.toFixed(1)
  let d = `M${f(px[0]!)} ${f(py[0]!)}`
  for (let i = 0; i < n; i++) {
    const i0 = (i - 1 + n) % n, i2 = (i + 1) % n, i3 = (i + 2) % n
    d += `C${f(px[i]! + (px[i2]! - px[i0]!) / 6)} ${f(py[i]! + (py[i2]! - py[i0]!) / 6)} ${f(px[i2]! - (px[i3]! - px[i]!) / 6)} ${f(py[i2]! - (py[i3]! - py[i]!) / 6)} ${f(px[i2]!)} ${f(py[i2]!)}`
  }
  return d + 'Z'
}
