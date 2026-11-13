import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** False when the device knows it has no network. True doesn't promise the server is reachable. */
export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine)
