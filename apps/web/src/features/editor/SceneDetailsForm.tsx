import type { Scene, SceneSettings } from '@ogre/shared'
import { useScenes, useUploadBanner } from '../../api/scenes.ts'
import { fieldClass } from '../../ui/Dialog.tsx'
import { Fader } from '../../ui/Fader.tsx'

const SETTINGS: { key: keyof SceneSettings; label: string }[] = [
  { key: 'autoStartMusic', label: 'Start music when the scene starts' },
  { key: 'musicIsPlaylist', label: 'Play music as a playlist' },
  { key: 'musicCrossfade', label: 'Crossfade between tracks' },
  { key: 'shuffle', label: 'Shuffle' },
]

export function SceneDetailsForm({
  scene,
  onChange,
}: {
  scene: Scene
  onChange: (patch: Partial<Scene>) => void
}) {
  const scenes = useScenes().data ?? []
  const banner = useUploadBanner()
  const setSetting = (key: keyof SceneSettings, value: boolean) =>
    onChange({ data: { ...scene.data, settings: { ...scene.data.settings, [key]: value } } })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-1 md:col-span-2">
        Name
        <input
          value={scene.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${fieldClass} font-display text-2xl font-bold`}
        />
      </label>
      <label className="flex flex-col gap-1">
        Tags
        <input
          defaultValue={scene.tags.join(', ')}
          onBlur={(e) =>
            onChange({
              tags: [
                ...new Set(
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                ),
              ],
            })
          }
          placeholder="Forest, Night, Tense"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Who can use it
        <select
          value={scene.visibility}
          onChange={(e) => onChange({ visibility: e.target.value as Scene['visibility'] })}
          className={fieldClass}
        >
          <option value="private">Only me</option>
          <option value="group">Everyone in the group</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Combat music
        <select
          value={scene.combatSceneId ?? ''}
          onChange={(e) => onChange({ combatSceneId: e.target.value || null })}
          className={fieldClass}
        >
          <option value="">None</option>
          {scenes
            .filter((s) => s.id !== scene.id && s.data.music.length > 0)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.data.music.length} tracks)
              </option>
            ))}
        </select>
        <span className="text-sm text-peat-400">
          The Combat button swaps to this scene's music and back.
        </span>
      </label>
      <label className="flex flex-col gap-1">
        Banner image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={banner.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) banner.mutate({ id: scene.id, file })
          }}
          className="text-ink-muted"
        />
        {banner.error && <span className="text-sm text-danger">{banner.error.message}</span>}
      </label>
      <fieldset className="flex flex-col gap-1.5 md:col-span-2">
        <legend className="mb-1">Playback</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {SETTINGS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scene.data.settings[key]}
                onChange={(e) => setSetting(key, e.target.checked)}
                className="accent-brass"
              />
              {label}
            </label>
          ))}
        </div>
        <label className="mt-2 flex max-w-sm items-center gap-3 whitespace-nowrap">
          Scene volume
          <Fader
            value={scene.data.globalVolume}
            label="Scene volume"
            onChange={(globalVolume) => onChange({ data: { ...scene.data, globalVolume } })}
          />
        </label>
      </fieldset>
    </div>
  )
}
