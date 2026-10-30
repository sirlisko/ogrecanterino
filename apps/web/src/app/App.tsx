import { Navigate, Route, Routes } from 'react-router'
import { useMe } from '../api/me.ts'
import { CreditsPage } from '../features/credits/CreditsPage.tsx'
import { EditorPage } from '../features/editor/EditorPage.tsx'
import { LibraryPage } from '../features/library/LibraryPage.tsx'
import { LoginPage } from '../features/login/LoginPage.tsx'
import { PlayerPage } from '../features/player/PlayerPage.tsx'
import { ScenesPage } from '../features/scenes/ScenesPage.tsx'
import { TablePage } from '../features/table/TablePage.tsx'
import { Layout } from './Layout.tsx'

export function App() {
  const me = useMe()
  if (me.isPending)
    return (
      <div className="grid min-h-dvh place-items-center">
        <img src="/logo.png" alt="Loading" className="h-16 w-16 animate-breathe" />
      </div>
    )
  if (!me.data) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }
  return (
    <Routes>
      <Route path="table" element={<TablePage />} />
      <Route element={<Layout />}>
        <Route index element={<ScenesPage />} />
        <Route path="scenes/:id" element={<PlayerPage />} />
        <Route path="scenes/:id/edit" element={<EditorPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="credits" element={<CreditsPage />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
