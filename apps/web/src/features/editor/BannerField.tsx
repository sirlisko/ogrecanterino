import type { Scene } from '@ogre/shared'
import { useRemoveBanner, useUploadBanner } from '../../api/scenes.ts'
import { SceneArt } from '../scenes/art/SceneArt.tsx'

export function BannerField({ scene }: { scene: Scene }) {
  const upload = useUploadBanner()
  const remove = useRemoveBanner()
  const busy = upload.isPending || remove.isPending
  const error = upload.error ?? remove.error

  return (
    <div className="flex flex-col gap-1">
      <span>Banner image</span>
      <div className="flex items-center gap-3">
        <SceneArt
          scene={scene}
          className="aspect-[16/7] w-40 shrink-0 rounded-lg ring-1 ring-peat-600"
        />
        <div className="flex flex-col items-start gap-1">
          <label
            className={`rounded-lg px-3 py-1.5 ring-1 ring-peat-600 ${busy ? 'opacity-50' : 'cursor-pointer hover:bg-peat-700'}`}
          >
            {upload.isPending ? 'Uploading…' : scene.bannerPath ? 'Replace image' : 'Choose image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) upload.mutate({ id: scene.id, file })
                e.target.value = ''
              }}
              className="sr-only"
            />
          </label>
          {scene.bannerPath ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => remove.mutate(scene.id)}
              className="text-sm text-ink-muted hover:text-danger"
            >
              Remove image
            </button>
          ) : (
            <span className="text-sm text-peat-400">
              Without one, the scene gets an illustration from its tags.
            </span>
          )}
        </div>
      </div>
      {error && <span className="text-sm text-danger">{error.message}</span>}
    </div>
  )
}
