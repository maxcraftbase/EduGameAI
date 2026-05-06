'use client'

import { useState, useRef, DragEvent } from 'react'

interface Props {
  onFile: (file: File) => void
}

const ACCEPTED = ['application/pdf', 'text/plain']
const MAX_MB = 10

export function UploadZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type) && !file.name.endsWith('.txt')) {
      return 'Nur PDF und TXT-Dateien erlaubt.'
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `Datei zu groß (max. ${MAX_MB} MB).`
    }
    return null
  }

  function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    onFile(file)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors select-none
          ${dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'}`}
      >
        <div className="text-3xl mb-3">📄</div>
        <p className="text-sm font-medium mb-1">PDF oder TXT hierher ziehen</p>
        <p className="text-xs text-muted-foreground">oder klicken zum Auswählen · max. {MAX_MB} MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
