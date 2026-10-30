import { type ReactNode, useEffect, useRef } from 'react'

export function Dialog({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className={`m-auto ${wide ? 'w-[min(44rem,calc(100vw-2rem))]' : 'w-[min(32rem,calc(100vw-2rem))]'} rounded-xl bg-peat-800 p-6 text-ink ring-1 ring-peat-600 backdrop:bg-peat-950/70`}
    >
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </dialog>
  )
}

export const fieldClass =
  'w-full rounded-lg bg-peat-900 px-3 py-2 ring-1 ring-peat-600 placeholder:text-peat-400'
