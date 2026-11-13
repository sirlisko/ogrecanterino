let kept = false

/**
 * Asks for the Google Fonts the page uses through the service worker, which keeps a copy. Without
 * this an offline page falls back to system fonts, since the browser loaded them before the worker
 * was watching. Once per page load; a failure just leaves the fallback fonts.
 */
export async function keepFonts(signal: AbortSignal) {
  if (kept) return
  const sheets = document.querySelectorAll<HTMLLinkElement>(
    'link[rel="stylesheet"][href^="https://fonts.googleapis.com/"]',
  )
  try {
    for (const { href } of sheets) {
      const css = await (await fetch(href, { mode: 'cors', signal })).text()
      const files = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]
      await Promise.all(files.map(([, url]) => url && fetch(url, { mode: 'cors', signal })))
    }
    kept = true
  } catch {
    // tried again on the next sync
  }
}
