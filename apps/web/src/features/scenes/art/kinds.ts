import type { Scene, SceneArt } from '@ogre/shared'

export const SCENE_ART_TITLES: Record<SceneArt, string> = {
  town: 'Town',
  night: 'Town at night',
  forest: 'Forest',
  horror: 'Haunted wilds',
  camp: 'Camp',
  mountain: 'Mountains',
  desert: 'Desert',
  sea: 'Sea',
  storm: 'Storm',
  dungeon: 'Dungeon',
  crypt: 'Crypt',
  caverns: 'Caverns',
  castle: 'Castle',
  temple: 'Temple',
  tower: 'Tower',
  battle: 'Battle',
}

const words = (list: string) => list.split(' ')

const NIGHT = words('night dark midnight')
const HORROR = words('horror haunted creepy ghost spooky scary')

/**
 * Settings in priority order: the first one any tag names wins. A fight comes last, because
 * "battle" is usually the mood of a place: a sea battle shows the sea.
 * Tags are matched case-insensitively against these words.
 */
const SETTINGS: [SceneArt, string[]][] = [
  ['sea', words('sea ocean ship boat coast beach pirate')],
  ['caverns', words('underground cave caves cavern caverns mine')],
  ['crypt', words('undead crypt tomb graveyard cemetery')],
  ['dungeon', words('dungeon prison sewer sewers ruins')],
  ['castle', words('castle palace throne keep court')],
  ['temple', words('holy temple church shrine monastery')],
  ['tower', words('magic wizard arcane tower mystery')],
  ['mountain', words('cold snow ice winter mountain mountains')],
  ['desert', words('hot desert sand dunes')],
  ['camp', words('camp campfire')],
  ['town', words('town tavern inn village city market people farm')],
  ['forest', words('forest woods jungle wilderness swamp grassland travel')],
  ['battle', words('combat battle fight boss war ambush')],
]

/** The illustration a scene gets from its tags when none was chosen. */
export function artForTags(tags: readonly string[]): SceneArt {
  const set = new Set(tags.map((t) => t.trim().toLowerCase()))
  const any = (list: string[]) => list.some((w) => set.has(w))
  const night = any(NIGHT)
  const horror = any(HORROR)
  for (const [kind, list] of SETTINGS) {
    if (!any(list)) continue
    if (kind === 'sea') return set.has('storm') || set.has('danger') ? 'storm' : 'sea'
    if (kind === 'dungeon' && horror) return 'crypt'
    if (kind === 'town') return night ? 'night' : 'town'
    if (kind === 'forest') return horror ? 'horror' : night && set.has('calm') ? 'camp' : 'forest'
    return kind
  }
  if (horror) return 'horror'
  return night ? 'night' : 'forest'
}

export function artFor(scene: Pick<Scene, 'tags' | 'data'>): SceneArt {
  return scene.data.art ?? artForTags(scene.tags)
}
