export function LoginHero() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="absolute -inset-10 rounded-full bg-arcane/25 blur-3xl" aria-hidden />
        <img
          src="/logo.png"
          alt="The Ogre Ballerino in sunglasses under a mirror ball"
          className="relative h-56 w-56 -rotate-3 drop-shadow-2xl transition-transform duration-300 hover:rotate-2 hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      <h1 className="mt-8 font-display text-5xl leading-none font-bold sm:text-6xl">
        Ogre Canterino
      </h1>
      <p className="mt-3 font-display text-xl text-ink-muted italic">
        The Ogre Ballerino’s audio compendium
      </p>
      <p className="mt-5 max-w-xs text-ink-muted">
        <span className="text-brass">Music</span>, <span className="text-lichen">ambience</span> and{' '}
        <span className="text-arcane">effects</span> for your table, live or over Discord.
      </p>
    </div>
  )
}
