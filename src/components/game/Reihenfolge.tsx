'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  text: string
  richtigeReihenfolge: string[]
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

export function Reihenfolge({ text, richtigeReihenfolge, hilfen, feedback, onAntwort }: Props) {
  const [items, setItems] = useState<string[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [korrekt, setKorrekt] = useState(false)
  const [hilfeIndex, setHilfeIndex] = useState<number | null>(null)

  useEffect(() => {
    setItems(shuffle(richtigeReihenfolge))
  }, [richtigeReihenfolge])

  function handleSelect(i: number) {
    if (submitted) return
    if (selected === null) {
      setSelected(i)
    } else if (selected === i) {
      setSelected(null)
    } else {
      setItems((prev) => {
        const next = [...prev]
        ;[next[selected], next[i]] = [next[i], next[selected]]
        return next
      })
      setSelected(null)
    }
  }

  function handleSubmit() {
    const isKorrekt = items.every((item, i) => item === richtigeReihenfolge[i])
    setKorrekt(isKorrekt)
    setSubmitted(true)
    setTimeout(() => onAntwort(items, isKorrekt), 1200)
  }

  const phase = selected === null ? 'idle' : 'selected'

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium leading-relaxed">{text}</p>

      {/* Dynamische Anweisung */}
      <div className={cn(
        'text-xs px-3 py-2 rounded-lg text-center font-medium transition-all duration-200',
        phase === 'idle'
          ? 'bg-muted/60 text-muted-foreground'
          : 'bg-violet-100 text-violet-700 border border-violet-200'
      )}>
        {phase === 'idle'
          ? '① Element antippen zum Auswählen'
          : '② Zielposition antippen zum Verschieben'}
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const isSelected = selected === i
          const isTarget = selected !== null && selected !== i
          const isCorrectPos = submitted && item === richtigeReihenfolge[i]
          const isWrongPos = submitted && item !== richtigeReihenfolge[i]

          return (
            <button
              key={item + i}
              onClick={() => handleSelect(i)}
              disabled={submitted}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-150',
                !submitted && !isSelected && !isTarget && 'border-border bg-white hover:border-violet-300 hover:bg-violet-50/50',
                !submitted && isSelected && 'border-violet-500 bg-violet-50 ring-2 ring-violet-300 shadow-sm scale-[1.01]',
                !submitted && isTarget && 'border-dashed border-violet-400 bg-violet-50/30 hover:bg-violet-100/50',
                submitted && isCorrectPos && 'border-green-400 bg-green-50',
                submitted && isWrongPos && 'border-red-300 bg-red-50',
              )}
            >
              <span className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                !submitted && isSelected && 'bg-violet-500 text-white',
                !submitted && isTarget && 'bg-violet-200 text-violet-700',
                !submitted && !isSelected && !isTarget && 'bg-gray-100 text-gray-500',
                submitted && isCorrectPos && 'bg-green-500 text-white',
                submitted && isWrongPos && 'bg-red-400 text-white',
              )}>
                {submitted ? (isCorrectPos ? '✓' : '✗') : i + 1}
              </span>
              <span className={cn(
                isSelected && 'font-medium text-violet-900',
                submitted && isCorrectPos && 'text-green-800',
                submitted && isWrongPos && 'text-red-700',
              )}>
                {item}
              </span>
              {isSelected && (
                <span className="ml-auto text-violet-400 text-xs">ausgewählt ↕</span>
              )}
            </button>
          )
        })}
      </div>

      {submitted && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium',
          korrekt ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        )}>
          {korrekt ? feedback.bei_korrekt : feedback.bei_falsch}
          {!korrekt && (
            <div className="mt-2 text-xs opacity-80 font-normal">
              Richtig: {richtigeReihenfolge.join(' → ')}
            </div>
          )}
        </div>
      )}

      {hilfen.length > 0 && !submitted && (
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setHilfeIndex((i) => (i === null ? 0 : Math.min(i + 1, hilfen.length - 1)))}
            disabled={hilfeIndex !== null && hilfeIndex >= hilfen.length - 1}
            className="text-xs px-3 py-1 rounded-full border border-violet-200 text-violet-600 hover:bg-violet-50 disabled:opacity-40"
          >
            💡 Hinweis
          </button>
          {hilfeIndex !== null && (
            <span className="text-xs text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
              {hilfen[hilfeIndex]}
            </span>
          )}
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
        >
          Reihenfolge bestätigen
        </button>
      )}
    </div>
  )
}
