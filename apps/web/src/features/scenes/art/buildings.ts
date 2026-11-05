import type { Random } from './random.ts'
import { circle, n } from './shapes.ts'

/** Gabled houses with the odd chimney and spire; `lights` are lit windows. */
export function roofs(rand: Random, width: number, base: number) {
  let d = ''
  let lights = ''
  let x = -6
  while (x < width + 6) {
    const spire = rand() < 0.1
    const w = spire ? 12 : 16 + rand() * 22
    const h = spire ? 26 + rand() * 8 : 8 + rand() * 16
    const roof = spire ? 16 : 5 + rand() * 9
    const top = base - h
    d += ` M${n(x)} 80 V${n(top)} L${n(x + w / 2)} ${n(top - roof)} L${n(x + w)} ${n(top)} V80 Z`
    if (!spire && rand() < 0.35) d += ` M${n(x + w * 0.68)} ${n(top - roof * 0.5)} v-9 h3 v9 Z`
    if (!spire && rand() < 0.75) {
      const lx = x + w * (0.2 + rand() * 0.45)
      const ly = top + 3 + rand() * Math.max(1, h - 9)
      lights += ` M${n(lx)} ${n(ly)} h2.5 v3 h-2.5 Z`
    }
    x += w + rand() * 2
  }
  return { d, lights }
}

/** A wall with arched openings; draw it with `evenodd` so the arches are holes. */
export function arcade(width: number, count: number, torches: boolean) {
  const w = width / count
  const gap = w * 0.24
  const r = (w - gap) / 2
  const spring = 34 + r
  let d = `M0 0 H${width} V80 H0 Z`
  let lights = ''
  for (let i = 0; i < count; i++) {
    const x0 = w * i + gap / 2
    d += ` M${n(x0)} 80 V${n(spring)} A${n(r)} ${n(r)} 0 0 1 ${n(x0 + 2 * r)} ${n(spring)} V80 Z`
    if (torches && i > 0) lights += circle(w * i, spring - 12, 1.6)
  }
  return { d, lights }
}

/** Stalactites from the top edge and stalagmites along the floor. */
export function cave(rand: Random, width: number) {
  let top = `M0 0 H${width} V6`
  let x = width
  while (x > 0) {
    const w = 8 + rand() * 18
    const h = 6 + rand() * 24
    top += ` L${n(x - w / 2)} ${n(6 + h)} L${n(x - w)} ${n(4 + rand() * 5)}`
    x -= w
  }
  let floor = ' M0 80 V74'
  x = 0
  while (x < width) {
    const w = 10 + rand() * 22
    const h = 3 + rand() * 14
    floor += ` L${n(x + w / 2)} ${n(74 - h)} L${n(x + w)} ${n(72 + rand() * 3)}`
    x += w
  }
  return `${top} L0 0 Z${floor} L${width} 80 Z`
}

export function castle(width: number) {
  let d = 'M0 80 V56'
  for (let x = 0; x < width; x += 16) d += ` H${x + 4} V50 H${x + 12} V56`
  d += ` H${width} V80 Z`
  let lights = ''
  for (const t of [Math.round(width * 0.16), Math.round(width * 0.74)]) {
    d += ` M${t} 80 V26 h4 v-5 h6 v5 h6 v-5 h6 v5 h4 V80 Z`
    lights += ` M${t + 11} 40 h4 v6 h-4 Z`
  }
  const k = Math.round(width / 2)
  d += ` M${k - 14} 80 V30 L${k} 8 L${k + 14} 30 V80 Z`
  lights += ` M${k - 2} 36 h4 v7 h-4 Z`
  return { d, lights }
}

export function temple(width: number) {
  const cx = width / 2
  const w = 120
  const l = cx - w / 2
  const r = cx + w / 2
  let d = `M0 80 V74 H${width} V80 Z`
  d += ` M${l - 8} 74 V70 H${r + 8} V74 Z M${l - 4} 70 V67 H${r + 4} V70 Z`
  for (let i = 0; i < 6; i++) d += ` M${n(l + 6 + i * ((w - 20) / 5))} 67 V38 h8 V67 Z`
  d += ` M${l - 6} 38 V33 H${r + 6} V38 Z M${l - 6} 33 L${cx} 16 L${r + 6} 33 Z`
  return d
}

export function tower(width: number) {
  const c = width / 2
  return {
    d:
      `M0 80 V74 Q${n(width / 4)} 70 ${n(c)} 72 T${width} 73 V80 Z` +
      ` M${c - 11} 74 V24 H${c + 11} V74 Z` +
      ` M${c - 15} 25 L${c} 2 L${c + 15} 25 Z` +
      ` M${c - 20} 74 V48 H${c - 11} V74 Z`,
    lights: ` M${c - 2.5} 34 h5 v7 h-5 Z M${c - 2.5} 52 h5 v7 h-5 Z`,
  }
}

/** A line of spears with the odd banner; `banners` are drawn in red. */
export function pikes(rand: Random, width: number) {
  let d = `M0 80 V70 Q${n(width / 4)} 66 ${n(width / 2)} 69 T${width} 68 V80 Z`
  let banners = ''
  for (let x = 4; x < width; x += 7 + rand() * 6) {
    const top = 34 + rand() * 18
    d += ` M${n(x)} 72 V${n(top)} L${n(x + 1)} ${n(top - 6)} L${n(x + 2)} ${n(top)} V72 Z`
    if (rand() < 0.12) banners += ` M${n(x + 2)} ${n(top + 2)} h10 l-3 4 l3 4 h-10 Z`
  }
  return { d, banners }
}
