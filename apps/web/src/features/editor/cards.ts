import type { Card, SceneData, SceneSection, Sound } from '@ogre/shared'

const DEFAULT_INTERVAL: [number, number] = [30_000, 90_000]

export function cardForSound(
  sound: Sound,
  section: SceneSection,
  id: string = crypto.randomUUID(),
): Card {
  const base = { id, label: sound.title, soundId: sound.id, volume: 80, enabled: true }
  if (section === 'effects') return { ...base, mode: 'oneshot' }
  if (section === 'ambiences' && sound.category === 'effect') {
    return { ...base, mode: 'interval', intervalMs: DEFAULT_INTERVAL, times: [1, 1] }
  }
  return { ...base, mode: 'loop' }
}

export function insertCard(
  data: SceneData,
  section: SceneSection,
  card: Card,
  index = data[section].length,
): SceneData {
  const list = [...data[section]]
  list.splice(Math.max(0, Math.min(index, list.length)), 0, card)
  return { ...data, [section]: list }
}

export function moveCard(
  data: SceneData,
  section: SceneSection,
  from: number,
  to: number,
): SceneData {
  const list = [...data[section]]
  const [card] = list.splice(from, 1)
  if (!card) return data
  list.splice(to, 0, card)
  return { ...data, [section]: list }
}

export function updateCard(
  data: SceneData,
  section: SceneSection,
  id: string,
  patch: Partial<Card>,
): SceneData {
  return { ...data, [section]: data[section].map((c) => (c.id === id ? { ...c, ...patch } : c)) }
}

export function removeCard(data: SceneData, section: SceneSection, id: string): SceneData {
  return { ...data, [section]: data[section].filter((c) => c.id !== id) }
}

export function sectionOfCard(data: SceneData, id: string): SceneSection | null {
  for (const s of ['music', 'ambiences', 'effects'] as const)
    if (data[s].some((c) => c.id === id)) return s
  return null
}
