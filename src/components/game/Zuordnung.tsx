'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Paar {
  links: string
  rechts: string
}

interface Props {
  text: string
  paare: Paar[]   // korrekte Zuordnungen
  hilfen: string[]
  feedback: { bei_korrekt: string; bei_falsch: string }
  onAntwort: (antworten: string[], korrekt: boolean) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Zuordnung({ text, paare, hilfen, feedback, onAntwort }: Props) {
  const [rechtsShuffled] = useState(() => shuffle(paare.map((p) => p.rechts)))
  const [zuordnungen, setZuordnungen] = useState<Record<number, string>>({})   // linksIndex → rechtsText
  const [selectedLinks, setSelectedLinks] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showHilfe, setShowHilfe] = useState(false)
  const [hilfeIndex, setHilfeIndex] = useState(0)

  function clickLinks(i: number) {
    if (submitted) return
    setSelectedLinks(i === selectedLinks ? null : i)
  }

  function clickRechts(r: string) {
    if (submitted || selectedLinks === null) return
    setZuordnungen((prev) => ({ ...prev, [selectedLinks]: r }))
    setSelectedLinks(null)
  }

  function submit() {
    const antworten = paare.map((_, i) => `${paare[i].links} → ${zuordnungen[i] ?? '?'}`)
    const korrekt = paare.every((p, i) => zuordnungen[i] === p.rechts)
    setSubmitted(true)
    onAntwort(antworten, korrekt)
  }

  const alleZugeordnet = paare.every((_, i) => zuordnungen[i] !== undefined)

  // Prüfen ob ein rechts-Element bereits vergeben ist
  const vergeben = new Set(Object.values(zuordnungen))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-medium leading-snug">{text}</p>
      <p className="text-xs text-muted-foreground -mt-2">Linke Spalte auswählen, dann rechte Spalte klicken</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Links */}
        <div className="flex flex-col gap-2">
          {paare.map((p, i) => {
            const isSelected = selectedLinks === i
            const hasMatch = zuordnungen[i] !== undefined
            const isKorrekt = submitted && zuordnungen[i] === p.rechts
            const isFalsch = submitted && zuordnungen[i] !== undefined && zuordnungen[i] !== p.rechts
            return (
              <button key={i} onClick={() => clickLinks(i)} disabled={submitted}
                className={cn(
                  'text-left px-3 py-2.5 rounded-xl border text-sm transition-all',
                  !submitted && isSelected && 'border-primary bg-primary/10 font-medium ring-1 ring-primary',
                  !submitted && !isSelected && hasMatch && 'border-primary/40 bg-primary/5',
                  !submitted && !isSelected && !hasMatch && 'border-border hover:border-primary/40',
                  submitted && isKorrekt && 'border-green-500 bg-green-50 text-green-900',
                  submitted && isFalsch && 'border-red-400 bg-red-50 text-red-900',
                  submitted && !hasMatch && 'border-border opacity-50',
                )}>
                {p.links}
              </button>
            )
          })}
        </div>

        {/* Rechts */}
        <div className="flex flex-col gap-2">
          {rechtsShuffled.map((r, i) => {
            const isVergeben = vergeben.has(r)
            const linksIdx = Object.entries(zuordnungen).find(([, v]) => v === r)?.[0]
            const isKorrekt = submitted && linksIdx !== undefined && paare[Number(linksIdx)].rechts === r
            const isFalsch = submitted && linksIdx !== undefined && paare[Number(linksIdx)].rechts !== r
            return (
              <button key={i} onClick={() => clickRechts(r)} disabled={submitted || (isVergeben && selectedLinks === null)}
                className={cn(
                  'text-left px-3 py-2.5 rounded-xl border text-sm transition-all',
                  !submitted && !isVergeben && selectedLinks !== null && 'border-dashed border-primary/60 hover:bg-primary/5',
                  !submitted && isVergeben && 'border-primary/30 bg-muted/30 opacity-70',
                  !submitted && !isVergeben && selectedLinks === null && 'border-border',
                  submitted && isKorrekt && 'border-green-500 bg-green-50 text-green-900',
                  submitted && isFalsch && 'border-red-400 bg-red-50 text-red-900',
                  submitted && !isVergeben && 'border-border opacity-50',
                )}>
                {r}
              </button>
            )
          })}
        </div>
      </div>

      {submitted && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm',
          paare.every((p, i) => zuordnungen[i] === p.rechts)
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        )}>
          {paare.every((p, i) => zuordnungen[i] === p.rechts)
            ? feedback.bei_korrekt || 'Alle Zuordnungen korrekt!'
            : feedback.bei_falsch || 'Einige Zuordnungen waren falsch.'}
        </div>
      )}

      {!submitted && hilfen.length > 0 && (
        <div>
          {!showHilfe ? (
            <button onClick={() => setShowHilfe(true)} className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2">
              Hilfe anzeigen
            </button>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Hilfe {hilfeIndex + 1}/{hilfen.length}</p>
              <p className="text-sm text-blue-900">{hilfen[hilfeIndex]}</p>
              {hilfeIndex < hilfen.length - 1 && (
                <button onClick={() => setHilfeIndex((h) => h + 1)} className="text-xs text-blue-600 hover:underline mt-2">
                  Weitere Hilfe
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <button onClick={submit} disabled={!alleZugeordnet}
          className="self-start bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors">
          Abgeben
        </button>
      )}
    </div>
  )
}
