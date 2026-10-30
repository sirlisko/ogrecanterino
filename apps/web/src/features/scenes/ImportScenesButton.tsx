import { useRef, useState } from 'react'
import { useImportScenes } from '../../api/scenes.ts'
import { Button } from '../../ui/Button.tsx'

export function ImportScenesButton() {
  const input = useRef<HTMLInputElement>(null)
  const importScenes = useImportScenes()
  const [message, setMessage] = useState<string | null>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const report = await importScenes.mutateAsync(JSON.parse(await file.text()))
      const missing = report.missing.reduce((n, m) => n + m.files.length, 0)
      setMessage(
        `Imported ${report.imported.length} scene${report.imported.length === 1 ? '' : 's'}` +
          (missing ? `. ${missing} sounds aren't in the library and are marked missing.` : '.'),
      )
    } catch (e) {
      setMessage(`Import failed: ${e instanceof Error ? e.message : 'unreadable file'}`)
    }
    if (input.current) input.current.value = ''
  }

  return (
    <>
      <Button onClick={() => input.current?.click()} disabled={importScenes.isPending}>
        Import
      </Button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {message && (
        <p role="status" className="basis-full text-right text-sm text-ink-muted">
          {message}
        </p>
      )}
    </>
  )
}
