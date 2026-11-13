import { build, type Plugin } from 'vite'

/**
 * Builds `sw/sw.ts` into `dist/sw.js` after the app, as one classic script so every browser can
 * register it. Build only: the dev server doesn't serve a service worker.
 */
export function serviceWorker(): Plugin {
  let root = ''
  let outDir = ''
  return {
    name: 'ogre-service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = config.build.outDir
    },
    async closeBundle() {
      await build({
        configFile: false,
        root,
        logLevel: 'warn',
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
