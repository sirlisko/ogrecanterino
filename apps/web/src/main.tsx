import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { App } from './app/App.tsx'
import { registerServiceWorker } from './features/offline/register.ts'
import { AppCrash } from './app/CrashNotice.tsx'
import { ErrorBoundary } from './ui/ErrorBoundary.tsx'
import './styles.css'
// Loaded up front so scenes started before visiting the scenes page are still recorded.
import './features/scenes/recentScenes.ts'
import './features/collections/sessionPlays.ts'
// Hands the saved settings to the audio engine before anything plays.
import './features/settings/settings.ts'

registerServiceWorker()

const router = createBrowserRouter([{ path: '*', element: <App /> }])

const queryClient = new QueryClient({
  defaultOptions: {
    // Offline, the service worker answers reads from the device, so they should still be tried.
    queries: { retry: 1, refetchOnWindowFocus: false, networkMode: 'offlineFirst' },
    // A change made offline fails at once with a clear message instead of replaying later.
    mutations: { networkMode: 'always' },
  },
})

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={() => <AppCrash />}>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
