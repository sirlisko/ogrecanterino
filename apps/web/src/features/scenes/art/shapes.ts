import type { Random } from './random.ts'

/** Every drawing is `width` × 80 user units; shapes sit on the bottom edge. */
export const ART_HEIGHT = 80

export const n = (v: number) => String(Math.round(v * 10) / 10)

export function circle(cx: number, cy: number, r: number) {
  return ` M${n(cx - r)} ${n(cy)} a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0 a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`
}

export function stars(rand: Random, width: number, count: number, maxY: number) {
  let d = ''
  for (let i = 0; i < count; i++)
    d += circle(rand() * width, 2 + rand() * maxY, 0.35 + rand() * 0.55)
  return d
}

/** A row of overlapping triangles along `base`, from `from` to `to`. */
export function pines(
  rand: Random,
  width: number,
  base: number,
  [minH, maxH]: [number, number],
  step: number,
  from = 0,
  to = width,
) {
  let d = `M${n(from)} 80 V${base}`
  let x = from - step / 2
  while (x < to) {
    const w = step * (0.7 + rand() * 0.6)
    const h = minH + rand() * (maxH - minH)
    d += ` L${n(x)} ${base} L${n(x + w / 2)} ${n(base - h)} L${n(x + w)} ${base}`
    x += w * 0.75
  }
  return `${d} L${n(to)} ${base} V80 Z`
}

/** A row of round treetops above solid ground. Drawn the same way round as `circle`, so overlaps stay filled. */
export function canopy(rand: Random, width: number, base: number, [minR, maxR]: [number, number]) {
  let d = `M0 80 H${width} V${base} H0 Z`
  let x = -maxR / 2
  while (x < width + maxR) {
    const r = minR + rand() * (maxR - minR)
    d += circle(x, base - r * 0.4, r)
    x += r * (1.1 + rand() * 0.5)
  }
  return d
}

/** Flat-topped desert rocks. */
export function mesas(rand: Random, width: number, base: number, count: number) {
  const w = width / count
  let d = `M0 80 V${base}`
  for (let i = 0; i < count; i++) {
    const left = w * i + w * (0.05 + rand() * 0.2)
    const right = w * (i + 1) - w * (0.05 + rand() * 0.2)
    const top = base - (14 + rand() * 22)
    const slope = 5 + rand() * 5
    d += ` L${n(left)} ${base} L${n(left + slope)} ${n(top)} L${n(right - slope)} ${n(top)} L${n(right)} ${base}`
  }
  return `${d} L${width} ${base} V80 Z`
}

export function hills(rand: Random, width: number, base: number, amp: number, count: number) {
  const w = width / count
  let d = `M0 80 V${n(base - rand() * amp * 0.5)}`
  for (let i = 0; i < count; i++) {
    const peak = base - amp * (0.5 + rand() * 0.8)
    d += ` Q${n(w * i + w / 2)} ${n(peak)} ${n(w * (i + 1))} ${n(base - rand() * amp * 0.5)}`
  }
  return `${d} V80 Z`
}

export function waves(rand: Random, width: number, base: number, amp: number, count: number) {
  const w = width / count
  let d = `M0 80 V${base}`
  for (let i = 0; i < count; i++) {
    const a = amp * (0.6 + rand() * 0.8)
    d += ` q${n(w / 4)} ${n(-a)} ${n(w / 2)} 0 t${n(w / 2)} 0`
  }
  return `${d} V80 Z`
}

/** A jagged ridge, plus snow caps for each peak. */
export function peaks(rand: Random, width: number, base: number, amp: number, count: number) {
  const w = width / count
  const points: [number, number][] = [[0, base - rand() * amp * 0.3]]
  for (let i = 0; i < count; i++) {
    points.push([w * i + w * (0.3 + rand() * 0.4), base - amp * (0.55 + rand() * 0.45)])
    points.push([w * (i + 1), base - rand() * amp * 0.3])
  }
  const ridge = points.map(([x, y]) => ` L${n(x)} ${n(y)}`).join('')
  let caps = ''
  for (let i = 1; i < points.length - 1; i += 2) {
    const [px, py] = points[i] ?? [0, 0]
    const [ax, ay] = points[i - 1] ?? [0, 0]
    const [bx, by] = points[i + 1] ?? [0, 0]
    const t = 0.22
    caps +=
      ` M${n(px)} ${n(py)}` +
      ` L${n(px + (bx - px) * t)} ${n(py + (by - py) * t)}` +
      ` L${n(px + (bx - px) * t * 0.5)} ${n(py + (by - py) * t + 2)}` +
      ` L${n(px + (ax - px) * t * 0.5)} ${n(py + (ay - py) * t + 1)}` +
      ` L${n(px + (ax - px) * t)} ${n(py + (ay - py) * t)} Z`
  }
  return { d: `M0 80${ridge} V80 Z`, caps }
}
