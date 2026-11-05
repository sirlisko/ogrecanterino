import { useState } from 'react'
import { Icon } from '../../ui/Icon.tsx'

const MAX_TAGS = 20

/** Tags as removable chips; type and press Enter or comma to add, Backspace to drop the last. */
export function TagInput({
  tags,
  suggestions,
  onChange,
}: {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
}) {
  const [text, setText] = useState('')
  const has = (t: string) => tags.some((x) => x.toLowerCase() === t.toLowerCase())
  const add = (raw: string) => {
    const tag = raw.trim()
    if (tag && !has(tag) && tags.length < MAX_TAGS) onChange([...tags, tag])
    setText('')
  }
  const offered = suggestions.filter((s) => !has(s)).slice(0, 8)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-peat-900 px-2 py-1.5 ring-1 ring-peat-600 focus-within:ring-brass">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-0.5 rounded-full bg-peat-700 py-0.5 pr-1 pl-3 text-[15px]"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              aria-label={`Remove tag ${t}`}
              className="grid h-6 w-6 place-items-center rounded-full text-ink-muted hover:bg-peat-600 hover:text-ink"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) =>
            e.target.value.endsWith(',')
              ? add(e.target.value.slice(0, -1))
              : setText(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(text)
            } else if (e.key === 'Backspace' && !text && tags.length) {
              onChange(tags.slice(0, -1))
            }
          }}
          onBlur={() => text && add(text)}
          aria-label="Add a tag"
          placeholder={tags.length ? 'Add a tag' : 'Forest, Night, Tense'}
          className="min-w-28 flex-1 bg-transparent px-1 py-1 outline-none placeholder:text-peat-400"
        />
      </div>
      {offered.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[15px]">
          <span className="text-ink-muted">Suggested</span>
          {offered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full px-3 py-0.5 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
