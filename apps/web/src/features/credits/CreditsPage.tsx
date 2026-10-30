import { useMemo } from 'react'
import { useSounds } from '../../api/sounds.ts'

export function CreditsPage() {
  const sounds = useSounds().data ?? []
  const byArtist = useMemo(() => {
    const groups = new Map<string, string[]>()
    for (const s of sounds) {
      const artist = s.artist || 'Unknown artist'
      groups.set(artist, [...(groups.get(artist) ?? []), s.title])
    }
    return [...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
  }, [sounds])

  return (
    <>
      <h1 className="font-display text-4xl font-bold">Credits</h1>
      <p className="mt-2 max-w-prose text-ink-muted">
        The music and sounds in this library are by the people below. Many are shared under Creative
        Commons licences that require attribution, so keep this page when you share the app.
      </p>
      <div className="mt-8 columns-1 gap-8 md:columns-2 xl:columns-3">
        {byArtist.map(([artist, titles]) => (
          <section key={artist} className="mb-6 break-inside-avoid">
            <h2 className="font-display text-xl font-bold">
              {artist}{' '}
              <span className="font-sans text-base font-normal text-ink-muted">
                {titles.length}
              </span>
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {titles.sort().join(', ')}
            </p>
          </section>
        ))}
      </div>
    </>
  )
}
