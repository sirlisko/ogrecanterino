const TAG_HUES: Record<string, number> = {
  Forest: 140,
  Jungle: 120,
  Swamp: 95,
  Desert: 40,
  Town: 30,
  Tavern: 25,
  Farm: 70,
  Ocean: 200,
  Beach: 190,
  Water: 195,
  River: 185,
  Mountain: 210,
  Storm: 220,
  Horror: 290,
  Ghost: 260,
  Creepy: 300,
  Dark: 270,
  Dungeon: 250,
  Battle: 5,
  Boss: 350,
}

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** Deterministic banner for scenes without an image, tinted by the scene's setting tags. */
export function sceneGradient(name: string, tags: string[]): string {
  const h = hash(name)
  const hue = tags.map((t) => TAG_HUES[t]).find((x) => x !== undefined) ?? h % 360
  const angle = 110 + (h % 70)
  return [
    `radial-gradient(circle at ${20 + (h % 60)}% ${30 + (h % 40)}%, oklch(0.55 0.09 ${hue} / 0.55), transparent 60%)`,
    `linear-gradient(${angle}deg, oklch(0.32 0.05 ${hue}), oklch(0.22 0.03 ${(hue + 40) % 360}))`,
  ].join(', ')
}
