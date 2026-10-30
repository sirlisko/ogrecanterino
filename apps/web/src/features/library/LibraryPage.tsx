import { useState } from 'react'
import { Button } from '../../ui/Button.tsx'
import { LibraryActions } from './LibraryActions.tsx'
import { SoundBrowser } from './SoundBrowser.tsx'
import { UploadDialog } from './UploadDialog.tsx'

export function LibraryPage() {
  const [uploading, setUploading] = useState(false)
  return (
    <>
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <h1 className="font-display text-4xl font-bold">Library</h1>
        <Button variant="primary" className="ml-auto" onClick={() => setUploading(true)}>
          Upload sound
        </Button>
      </div>
      <SoundBrowser actions={(s) => <LibraryActions sound={s} />} />
      {uploading && <UploadDialog onClose={() => setUploading(false)} />}
    </>
  )
}
