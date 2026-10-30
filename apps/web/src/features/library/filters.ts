import type { Sound, SoundCategory } from '@ogre/shared'

export interface SoundFilter {
  query: string
  category: SoundCategory | null
  tags: string[]
  favouritesOnly: boolean
}

export const emptyFilter: SoundFilter = {
  query: '',
  category: null,
  tags: [],
  favouritesOnly: false,
}

/** Every whitespace-separated term must match the title, artist or a tag. */
export function filterSounds(
  sounds: Sound[],
  f: SoundFilter,
  favourites: ReadonlySet<string>,
): Sound[] {
  const terms = f.query.toLowerCase().split(/\s+/).filter(Boolean)
  return sounds.filter((s) => {
    if (f.category && s.category !== f.category) return false
    if (f.favouritesOnly && !favourites.has(s.id)) return false
    if (f.tags.some((t) => !s.tags.includes(t))) return false
    if (!terms.length) return true
    const haystack = `${s.title} ${s.artist} ${s.tags.join(' ')}`.toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}

const STRUCTURAL_TAGS = new Set(['Music', 'Sound Effect', 'Ambience'])

export function tagCounts(sounds: Sound[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const s of sounds)
    for (const t of s.tags) if (!STRUCTURAL_TAGS.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}
