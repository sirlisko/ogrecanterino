import { type Scene, type SceneArt as Art, sceneArtKinds } from '@ogre/shared'
import { useRemoveBanner, useUploadBanner } from '../../api/scenes.ts'
import { Button } from '../../ui/Button.tsx'
import { Icon } from '../../ui/Icon.tsx'
import { artForTags, SCENE_ART_TITLES } from '../scenes/art/kinds.ts'
import { SceneArt } from '../scenes/art/SceneArt.tsx'

const tile = (selected: boolean) =>
  `overflow-hidden rounded-[10px] bg-peat-900 text-left ring-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'ring-2 ring-brass' : 'ring-peat-700 enabled:hover:ring-peat-400'}`

/**
 * Automatic (from the tags), one of the drawn illustrations, or an uploaded picture.
 * An upload wins over the rest, so the illustrations wait until it's removed.
 */
export function PicturePicker({
  scene,
  onPick,
  onClose,
}: {
  scene: Scene
  onPick: (art: Art | undefined) => void
  onClose: () => void
}) {
  const upload = useUploadBanner()
  const remove = useRemoveBanner()
  const busy = upload.isPending || remove.isPending
  const error = upload.error ?? remove.error
  const uploaded = !!scene.bannerPath
  const current = uploaded ? 'upload' : (scene.data.art ?? 'auto')

  return (
    <section
      aria-label="Scene picture"
      className="mb-6 rounded-xl bg-peat-800 p-4 ring-1 ring-peat-700 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl font-bold">Scene picture</h2>
        <p className="text-[15px] text-ink-muted">
          Shown on the scene card, in the player and in table mode.
        </p>
        <Button className="ml-auto" onClick={onClose}>
          Done
        </Button>
      </div>
      {uploaded && (
        <p className="mt-3 text-[15px] text-ink-muted">
          Your uploaded picture is in use. Remove it to choose an illustration.
        </p>
      )}
      <div
        role="group"
        aria-label="Choose a picture"
        className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2.5"
      >
        <button
          type="button"
          aria-pressed={current === 'auto'}
          disabled={uploaded}
          onClick={() => onPick(undefined)}
          className={tile(current === 'auto')}
        >
          <SceneArt scene={scene} show="auto" className="h-16" />
          <span className="block px-2.5 pt-1.5 pb-2">
            <span className="block text-[15px] font-bold">Automatic</span>
            <span className="block text-sm text-ink-muted">
              From the tags: {SCENE_ART_TITLES[artForTags(scene.tags)]}
            </span>
          </span>
        </button>
        {sceneArtKinds.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={current === kind}
            disabled={uploaded}
            onClick={() => onPick(kind)}
            className={tile(current === kind)}
          >
            <SceneArt scene={scene} show={kind} className="h-16" />
            <span className="block px-2.5 pt-1.5 pb-2 text-[15px]">{SCENE_ART_TITLES[kind]}</span>
          </button>
        ))}
        {uploaded ? (
          <div className={`${tile(true)} flex flex-col`}>
            <SceneArt scene={scene} className="h-16" />
            <span className="flex items-center justify-between gap-2 px-2.5 pt-1.5 pb-2 text-[15px]">
              Your picture
              <button
                type="button"
                disabled={busy}
                onClick={() => remove.mutate(scene.id)}
                className="text-sm text-ink-muted hover:text-danger"
              >
                {remove.isPending ? 'Removing…' : 'Remove'}
              </button>
            </span>
          </div>
        ) : (
          <label
            className={`flex min-h-26 flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed border-peat-600 p-2.5 text-center focus-within:border-brass ${busy ? 'opacity-50' : 'cursor-pointer hover:border-ink-muted'}`}
          >
            <Icon name="upload" className="h-5 w-5" />
            <span className="text-[15px]">
              {upload.isPending ? 'Uploading…' : 'Upload a picture'}
            </span>
            <span className="text-sm text-ink-muted">JPG, PNG, WebP or AVIF</span>
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
        )}
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error.message}</p>}
    </section>
  )
}
