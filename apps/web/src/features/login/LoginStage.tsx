import type { CSSProperties } from 'react'

const BEAMS = [
  { color: 'var(--color-brass)', angle: 26, delay: 0 },
  { color: 'var(--color-lichen)', angle: 50, delay: 120 },
  { color: 'var(--color-arcane)', angle: 74, delay: 240 },
]

export function LoginStage() {
  return (
    <div className="relative w-40 shrink-0 self-end sm:w-64 md:self-auto lg:w-80">
      {/* Beams start at the mirror ball painted in the logo, so their origin tracks the image. */}
      <div className="pointer-events-none absolute top-[22%] left-[84%]" aria-hidden>
        {BEAMS.map((beam) => (
          <div
            key={beam.color}
            className="login-beam"
            style={
              {
                '--beam-color': beam.color,
                '--beam-angle': `${beam.angle}deg`,
                animationDelay: `${beam.delay}ms`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <img
        src="/logo.png"
        alt="The Ogre Ballerino in sunglasses under a mirror ball"
        className="relative z-10 w-full rotate-3 drop-shadow-2xl"
      />
    </div>
  )
}
