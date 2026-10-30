const KINDS = [
  { label: 'Music', color: 'text-brass' },
  { label: 'Ambience', color: 'text-lichen' },
  { label: 'Effects', color: 'text-arcane' },
]

export function LoginHero() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-arcane/25 blur-3xl" aria-hidden />
        <img
          src="/logo.png"
          alt="The Ogre Ballerino in sunglasses under a mirror ball"
          className="relative h-40 w-40 -rotate-3 drop-shadow-2xl transition-transform duration-300 hover:rotate-2 hover:scale-105"
        />
      </div>
      <p className="mt-8 text-sm font-medium tracking-[0.2em] text-brass uppercase">
        The Ogre Ballerino's official
      </p>
      <h1 className="mt-2 font-display text-5xl leading-none font-bold sm:text-6xl">
        Audio Compendium
      </h1>
      <p className="mt-2 font-display text-xl text-ink-muted italic">a.k.a. Ogre Canterino</p>
      <ul className="mt-5 flex items-center gap-3 text-sm font-medium">
        {KINDS.map((k, i) => (
          <li key={k.label} className="flex items-center gap-3">
            {i > 0 && <span className="text-peat-400">·</span>}
            <span className={k.color}>{k.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-xs text-ink-muted">For your table, live or over Discord.</p>
    </div>
  )
}
