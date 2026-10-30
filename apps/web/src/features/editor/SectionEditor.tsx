import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Card, SceneSection } from '@ogre/shared'
import { CardRow } from './CardRow.tsx'

export const SECTION_META: Record<SceneSection, { title: string; color: string; empty: string }> = {
  music: {
    title: 'Music',
    color: 'var(--color-brass)',
    empty: 'Drop music here to build the playlist.',
  },
  ambiences: {
    title: 'Ambience',
    color: 'var(--color-lichen)',
    empty: 'Drop loops or occasional sounds here.',
  },
  effects: {
    title: 'Effects',
    color: 'var(--color-arcane)',
    empty: 'Drop sounds here to make effect pads.',
  },
}

interface Props {
  section: SceneSection
  cards: Card[]
  onChange: (id: string, patch: Partial<Card>) => void
  onRemove: (id: string) => void
}

export function SectionEditor({ section, cards, onChange, onRemove }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `section:${section}` })
  const meta = SECTION_META[section]

  return (
    <section aria-label={meta.title}>
      <h2 className="mb-2 font-display text-2xl font-bold" style={{ color: meta.color }}>
        {meta.title}{' '}
        <span className="font-sans text-base font-normal text-ink-muted">{cards.length}</span>
      </h2>
      <SortableContext
        id={section}
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul
          ref={setNodeRef}
          className={`flex min-h-16 flex-col gap-1.5 rounded-xl p-1.5 ring-1 transition-colors ${isOver ? 'bg-peat-800 ring-2' : 'ring-peat-700'}`}
          style={isOver ? { ['--tw-ring-color' as string]: meta.color } : undefined}
        >
          {cards.length === 0 && <li className="px-3 py-4 text-ink-muted">{meta.empty}</li>}
          {cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              section={section}
              color={meta.color}
              onChange={(patch) => onChange(card.id, patch)}
              onRemove={() => onRemove(card.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </section>
  )
}
