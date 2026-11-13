import type { Scene } from '@ogre/shared'
import { NotOnDevice } from '../offline/NotOnDevice.tsx'

/** How many cards a scene has per section, each in its section's colour. */
export function SceneCounts({ scene, className = '' }: { scene: Scene; className?: string }) {
  const { music, ambiences, effects } = scene.data
  return (
    <p className={`flex flex-wrap gap-x-2.5 text-sm lining-nums ${className}`}>
      <span className="text-brass">{music.length} music</span>
      <span className="text-lichen">{ambiences.length} ambience</span>
      <span className="text-arcane">{effects.length} effects</span>
      <NotOnDevice sceneId={scene.id} />
    </p>
  )
}
