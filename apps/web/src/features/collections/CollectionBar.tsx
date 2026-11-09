import { useEffect, useRef, useState } from 'react'
import { useCollections } from '../../api/collections.ts'
import { setActiveCollection, useActiveCollection } from './activeCollection.ts'
import { CollectionDialog } from './CollectionDialog.tsx'

const tab = (active: boolean) =>
  `shrink-0 border-b-[3px] pt-1.5 pb-2 text-left font-display text-xl font-bold whitespace-nowrap transition-colors ${
    active ? 'border-brass text-ink' : 'border-transparent text-ink-muted hover:text-ink'
  }`

/** Collections are what you're running, not a filter, so they get tabs rather than chips. */
export function CollectionBar() {
  const collections = useCollections().data ?? []
  const active = useActiveCollection((s) => s.id)
  const [creating, setCreating] = useState(false)
  const activeTab = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeTab.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active])

  return (
    <nav aria-label="Collections" className="mt-5 flex items-end gap-x-5 border-b border-peat-700">
      {/* Scrolls sideways on a phone rather than wrapping. Sits over the rule, so a tab's underline replaces it. */}
      <div className="-mb-px flex min-w-0 flex-1 items-end gap-x-7 overflow-x-auto [scrollbar-width:none]">
        <button
          ref={active ? undefined : activeTab}
          type="button"
          aria-pressed={!active}
          onClick={() => setActiveCollection(null)}
          className={tab(!active)}
        >
          All scenes
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            ref={active === c.id ? activeTab : undefined}
            type="button"
            aria-pressed={active === c.id}
            onClick={() => setActiveCollection(c.id)}
            className={tab(active === c.id)}
          >
            {c.name}{' '}
            <span className="font-sans text-[15px] font-normal text-ink-muted lining-nums">
              {c.sceneIds.length}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="shrink-0 pb-2.5 text-[15px] whitespace-nowrap text-ink-muted hover:text-ink"
      >
        New collection
      </button>
      {creating && <CollectionDialog onClose={() => setCreating(false)} />}
    </nav>
  )
}
