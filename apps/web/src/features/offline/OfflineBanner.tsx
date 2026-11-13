import { useOnline } from './useOnline.ts'

/** Says up front why some things won't work, so a refused save or a silent scene isn't a mystery. */
export function OfflineBanner() {
  if (useOnline()) return null
  return (
    <p
      role="status"
      className="border-b border-peat-700 bg-peat-800 px-4 py-2 text-center text-[15px] text-ink-muted"
    >
      You're offline. Collections kept on this device still play; editing comes back when you
      reconnect.
    </p>
  )
}
