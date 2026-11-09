const EMOJI = String.raw`(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}[️\p{Emoji_Modifier}]?(?:‍\p{Extended_Pictographic}[️\p{Emoji_Modifier}]?)*)`
const LEADING_EMOJI = new RegExp(`^((?:${EMOJI}\\s*)+)(.+)$`, 'su')

/** Imported labels often start with emoji and no space. A label that is only emoji stays whole. */
export function splitLabel(label: string): { emoji: string; text: string } {
  const match = LEADING_EMOJI.exec(label)
  return match
    ? { emoji: (match[1] as string).replace(/\s+/gu, ''), text: match[2] as string }
    : { emoji: '', text: label }
}
