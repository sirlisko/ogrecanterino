import type { Scene } from '@ogre/shared'
import { useMe } from '../../api/me.ts'
import { SceneCard } from './SceneCard.tsx'

export function SceneGrid({ scenes, numbered }: { scenes: Scene[]; numbered?: boolean }) {
  const me = useMe().data
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {scenes.map((s, i) => (
        <SceneCard
          key={s.id}
          scene={s}
          canEdit={me?.role === 'admin' || s.ownerId === me?.id}
          mine={s.ownerId === me?.id}
          position={numbered ? i + 1 : undefined}
        />
      ))}
    </div>
  )
}
