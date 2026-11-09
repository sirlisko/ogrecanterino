import type { SceneArt } from '@ogre/shared'
import { arcade, castle, cave, pikes, roofs, temple, tower } from './buildings.ts'
import type { Random } from './random.ts'
import { canopy, circle, hills, mesas, peaks, pines, stars, waves } from './shapes.ts'

interface Palette {
  top: string
  bottom: string
  far: string
  near: string
}

/** Dark, low-chroma skies so the art sits under text and next to the section colours. */
export const PALETTES: Record<SceneArt, Palette> = {
  town: { top: '#2a2620', bottom: '#3d3224', far: '#4b3d2b', near: '#1b1712' },
  night: { top: '#141a21', bottom: '#24303b', far: '#2c3946', near: '#12161b' },
  forest: { top: '#1d2a23', bottom: '#2e4234', far: '#2d4535', near: '#141d17' },
  horror: { top: '#1b1720', bottom: '#2c2436', far: '#33293f', near: '#120f16' },
  camp: { top: '#131a1d', bottom: '#1f2a2a', far: '#1a2422', near: '#0f1513' },
  mountain: { top: '#1c2530', bottom: '#2c3a4a', far: '#3a4a5e', near: '#161e27' },
  desert: { top: '#2e2418', bottom: '#4d3820', far: '#5c4428', near: '#2b2014' },
  sea: { top: '#152129', bottom: '#22384a', far: '#2a4658', near: '#10202a' },
  storm: { top: '#101519', bottom: '#1c262e', far: '#24333d', near: '#0c1318' },
  dungeon: { top: '#3a2d1c', bottom: '#1c1712', far: '#262320', near: '#191b1a' },
  crypt: { top: '#2a2236', bottom: '#15121a', far: '#221f27', near: '#171719' },
  caverns: { top: '#1f2a2c', bottom: '#14191a', far: '#24302f', near: '#0f1414' },
  castle: { top: '#2a1f2c', bottom: '#45303a', far: '#3e2d38', near: '#1a1418' },
  temple: { top: '#2f2a1f', bottom: '#4a412c', far: '#5a4f36', near: '#211d15' },
  tower: { top: '#1a1730', bottom: '#2c2648', far: '#2e2a48', near: '#13111f' },
  battle: { top: '#2a1817', bottom: '#4a2621', far: '#4a2a25', near: '#1a0f0e' },
}

type FillRule = 'nonzero' | 'evenodd'

/** SVG path data for each layer, back to front. Empty strings are layers the kind doesn't use. */
export interface Drawing {
  stars: string
  orb: string
  orbFill: string
  orbOpacity: number
  far: string
  farRule: FillRule
  detail: string
  detailFill: string
  near: string
  nearRule: FillRule
  /** Windows, torches and fires: the parts that light up while a scene is live. */
  lights: string
  lightsFill: string
}

const INK = 'var(--color-ink)'
const BRASS = 'var(--color-brass)'
const LICHEN = 'var(--color-lichen)'
const ARCANE = 'var(--color-arcane)'
const DANGER = 'var(--color-danger)'

/** Keeps a sun or moon out of the top corners, where a card's buttons sit. */
function orbX(rand: Random, width: number, radius: number) {
  const margin = width * 0.2 + radius
  return margin + rand() * (width - 2 * margin)
}

const pick = (rand: Random, styles: number) => Math.floor(rand() * styles)

/** Forests are the most common picture, so one scene's shouldn't pass for another's. */
function woods(rand: Random, W: number): Pick<Drawing, 'far' | 'near'> {
  switch (pick(rand, 4)) {
    case 0: {
      const left = W * (0.2 + rand() * 0.15)
      const right = W * (0.65 + rand() * 0.15)
      return {
        far: pines(rand, W, 62, [6, 18], 10),
        near:
          hills(rand, W, 78, 3, 3) +
          pines(rand, W, 80, [18, 40], 15, 0, left) +
          ' ' +
          pines(rand, W, 80, [18, 40], 15, right, W),
      }
    }
    case 1:
      return { far: hills(rand, W, 66, 8, 3), near: pines(rand, W, 80, [40, 66], 34) }
    case 2:
      return { far: canopy(rand, W, 66, [7, 13]), near: canopy(rand, W, 82, [12, 22]) }
    default:
      return { far: pines(rand, W, 62, [8, 22], 10), near: pines(rand, W, 80, [14, 34], 15) }
  }
}

function dunes(rand: Random, W: number): Pick<Drawing, 'far' | 'near'> {
  switch (pick(rand, 3)) {
    case 0:
      return {
        far: mesas(rand, W, 66, Math.max(2, Math.round(W / 120))),
        near: hills(rand, W, 78, 6, 2),
      }
    case 1:
      return { far: hills(rand, W, 72, 28, 2), near: hills(rand, W, 78, 8, 3) }
    default:
      return { far: hills(rand, W, 64, 14, 3), near: hills(rand, W, 76, 10, 2) }
  }
}

export function drawScene(kind: SceneArt, rand: Random, width: number): Drawing {
  const out: Drawing = {
    stars: '',
    orb: '',
    orbFill: INK,
    orbOpacity: 0.8,
    far: '',
    farRule: 'nonzero',
    detail: '',
    detailFill: INK,
    near: '',
    nearRule: 'nonzero',
    lights: '',
    lightsFill: BRASS,
  }
  const W = width
  switch (kind) {
    case 'town':
    case 'night': {
      out.far = hills(rand, W, 60, 10, 4)
      const town = roofs(rand, W, 76)
      out.near = town.d
      out.lights = town.lights
      if (kind === 'night') {
        out.stars = stars(rand, W, Math.round(W / 12), 40)
        out.orb = circle(orbX(rand, W, 7), 18, 7)
      }
      break
    }
    case 'forest':
    case 'horror':
      Object.assign(out, woods(rand, W))
      if (kind === 'horror') {
        out.stars = stars(rand, W, Math.round(W / 14), 36)
        out.orb = circle(orbX(rand, W, 9), 20, 9)
        out.orbFill = '#c9b8d8'
        out.orbOpacity = 0.55
      }
      break
    case 'camp':
      out.far = pines(rand, W, 62, [8, 22], 10)
      out.near = hills(rand, W, 78, 4, 3)
      out.stars = stars(rand, W, Math.round(W / 14), 36)
      out.orb = circle(W / 2, 74, 18)
      out.orbFill = BRASS
      out.orbOpacity = 0.28
      out.lights = `M${W / 2 - 6} 76 L${W / 2} 63 L${W / 2 + 6} 76 Z`
      break
    case 'mountain': {
      const ridge = peaks(rand, W, 66, 46, Math.max(3, Math.round(W / 80)))
      out.far = ridge.d
      out.detail = ridge.caps
      out.near = pines(rand, W, 80, [6, 16], 9)
      break
    }
    case 'desert': {
      const r = 10 + rand() * 9
      out.orb = circle(orbX(rand, W, r), 40, r)
      out.orbFill = BRASS
      out.orbOpacity = 0.45
      Object.assign(out, dunes(rand, W))
      break
    }
    case 'sea':
    case 'storm': {
      const storm = kind === 'storm'
      const sx = Math.round(W * 0.65)
      const ship = ` M${sx} 60 h20 l-4 5 h-13 Z M${sx + 8} 60 V44 L${sx + 19} 58 Z`
      out.far = waves(rand, W, 62, storm ? 5 : 2.5, Math.round(W / 26)) + ship
      out.near = waves(rand, W, 70, storm ? 9 : 4, Math.round(W / 52))
      if (storm) {
        const bx = Math.round(W * 0.3)
        out.lights = `M${bx} 4 L${bx - 8} 26 H${bx - 1} L${bx - 8} 46 L${bx + 8} 20 H${bx + 1} L${bx + 7} 4 Z`
        out.lightsFill = INK
      } else {
        out.orb = circle(orbX(rand, W, 10), 26, 10)
        out.orbOpacity = 0.35
      }
      break
    }
    case 'dungeon':
    case 'crypt': {
      out.far = arcade(W, Math.round(W / 40), false).d
      out.farRule = 'evenodd'
      const hall = arcade(W, Math.round(W / 64), true)
      out.near = hall.d
      out.nearRule = 'evenodd'
      out.lights = hall.lights
      if (kind === 'crypt') out.lightsFill = LICHEN
      break
    }
    case 'caverns':
      out.far = pines(rand, W, 76, [4, 14], 8)
      out.near = cave(rand, W)
      out.lights = circle(W * 0.69, 60, 1.6) + circle(W * 0.28, 64, 1.4)
      out.lightsFill = LICHEN
      break
    case 'castle': {
      out.orb = circle(orbX(rand, W, 12), 52, 12)
      out.orbFill = BRASS
      out.orbOpacity = 0.3
      out.far = hills(rand, W, 64, 10, 3)
      const keep = castle(W)
      out.near = keep.d
      out.lights = keep.lights
      break
    }
    case 'temple':
      out.orb = circle(W / 2, 30, 26)
      out.orbFill = BRASS
      out.orbOpacity = 0.22
      out.far = hills(rand, W, 70, 8, 3)
      out.near = temple(W)
      break
    case 'tower': {
      out.stars = stars(rand, W, Math.round(W / 10), 50)
      out.orb = circle(orbX(rand, W, 6), 16, 6)
      out.far = hills(rand, W, 68, 8, 4)
      const t = tower(W)
      out.near = t.d
      out.lights = t.lights
      out.lightsFill = ARCANE
      break
    }
    case 'battle': {
      out.orb = circle(orbX(rand, W, 18), 50, 18)
      out.orbFill = DANGER
      out.orbOpacity = 0.3
      out.far = peaks(rand, W, 64, 30, Math.max(4, Math.round(W / 64))).d
      const line = pikes(rand, W)
      out.near = line.d
      out.detail = line.banners
      out.detailFill = DANGER
      break
    }
  }
  return out
}
