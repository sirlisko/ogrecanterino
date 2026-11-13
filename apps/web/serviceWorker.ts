import { readdirSync } from 'node:fs'
import { build, type Plugin } from 'vite'

/**
 * Builds `sw/sw.ts` into `dist/sw.js` after the app, as one classic script so every browser can
 * register it, and tells it which files make up this build so it can keep them. Build only: the
 * dev server doesn't serve a service worker.
 */
export function serviceWorker(): Plugin {
  let root = ''
  let outDir = ''
  let publicDir = ''
  let appFiles: string[] = []
  return {
    name: 'ogre-service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = config.build.outDir
      publicDir = config.publicDir
    },
    writeBundle(_, bundle) {
      // The logo and icons too: the loading screen and header need them before anything is cached.
      const extras = publicDir
        ? readdirSync(publicDir, { withFileTypes: true }).filter((f) => f.isFile())
        : []
      appFiles = [...Object.keys(bundle), ...extras.map((f) => f.name)]
        .filter((f) => !f.endsWith('.map'))
        .map((f) => `/${f}`)
    },
    async closeBundle() {
      await build({
        configFile: false,
        root,
        logLevel: 'warn',
        define: {
          __APP_FILES__: JSON.stringify(appFiles),
          __BUILD__: JSON.stringify(Date.now().toString(36)),
        },
        build: {
          outDir,
          emptyOutDir: false,
          copyPublicDir: false,
          lib: {
            entry: 'sw/sw.ts',
            formats: ['iife'],
            name: 'ogreServiceWorker',
            fileName: () => 'sw.js',
          },
        },
      })
    },
  }
}
