import type { SoundUsage } from '@ogre/shared'

const MAX_NAMED = 5

const scenesWord = (n: number) => (n === 1 ? 'scene' : 'scenes')

export function deleteSoundMessage(title: string, { scenes, privateCount }: SoundUsage): string {
  const lines = [`Delete "${title}" from the library?`]
  const total = scenes.length + privateCount
  if (total) {
    const named = scenes.slice(0, MAX_NAMED)
    const unnamed = total - named.length
    const parts = [...named, ...(unnamed ? [`${unnamed} other ${scenesWord(unnamed)}`] : [])]
    lines.push(
      `It's used in ${total} ${scenesWord(total)} (${parts.join(', ')}), which will show it as missing.`,
    )
  }
  lines.push("This can't be undone.")
  return lines.join('\n\n')
}
