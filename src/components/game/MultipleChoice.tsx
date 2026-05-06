'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Option {
  text: string
  isCorrect: boolean
}

interface Props {
  aufgabeId: string
  text: string
  optionen: Option[]
  mehrfach: boolean
  hilfen: string[]
  feedback: { bei_korrekt: string; bei_falsch: string }
  onAntwort: (antworten: string[], korrekt: boolean) => void
}

export function MultipleChoice({ aufgabeId, text, optionen, mehrfach, hilfen, feedback, onAntwort }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [showHilfe, setShowHilfe] = useState(false)
  const [hilfeIndex, setHilfeIndex] = useState(0)

  function toggle(i: number) {
    if (submitted) return
    const next = new Set(selected)
    if (mehrfach) {
      next.has(i) ? next.delete(i) : next.add(i)
    } else {
      next.clear()
      next.add(i)
    }
    setSelected(next)
  }

  function submit() {
    if (selected.size === 0) return
    const antworten = Array.from(selected).map((i) => optionen[i].text)
    const korrekt = optionen.every((o, i) => o.isCorrect === selected.has(i))
    setSubmitted(true)
    onAntwort(antworten, korrekt)
  }

  const korrektNachSubmit = submitted && optionen.every((o, i) => o.isCorrect === selected.has(i))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-medium leading-snug">{text}</p>

      {mehrfach && (
        <p className="text-xs text-muted-foreground -mt-2">Mehrere Antworten möglich</p>
      )}

      <div className="flex flex-col gap-2">
        {optionen.map((opt, i) => {
          const isSelected = selected.has(i)
          const showResult = submitted
          const isRight = opt.isCorrect
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={submitted}
              className={cn(
                'text-left px-4 py-3 rounded-xl border text-sm transition-all',
                !submitted && !isSelected && 'border-border hover:border-primary/50 hover:bg-primary/5',
                !submitted && isSelected && 'border-primary bg-primary/10 font-medium',
                showResult && isSelected && isRight && 'border-green-500 bg-green-50 text-green-900',
                showResult && isSelected && !isRight && 'border-red-400 bg-red-50 text-red-900',
                showResult && !isSelected && isRight && 'border-green-300 bg-green-50/50 text-green-700',
                showResult && !isSelected && !isRight && 'border-border opacity-50',
              )}
            >
              <span className="flex items-center gap-3">
                <span className={cn(
                  'w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center text-xs',
                  mehrfach ? 'rounded' : 'rounded-full',
                  !submitted && isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-current',
                  showResult && isSelected && isRight && 'border-green-500 bg-green-500 text-white',
                  showResult && isSelected && !isRight && 'border-red-400 bg-red-400 text-white',
                )}>
                  {showResult && isRight ? '✓' : isSelected && !showResult ? '•' : ''}
                </span>
                {opt.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Feedback nach Abgabe */}
      {submitted && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm',
          korrektNachSubmit ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        )}>
          {korrektNachSubmit ? feedback.bei_korrekt || 'Richtig!' : feedback.bei_falsch || 'Nicht ganz — die richtigen Antworten sind grün markiert.'}
        </div>
      )}

      {/* Hilfe */}
      {!submitted && hilfen.length > 0 && (
        <div>
          {!showHilfe ? (
            <button onClick={() => setShowHilfe(true)}
              className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2">
              Hilfe anzeigen
            </button>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Hilfe {hilfeIndex + 1}/{hilfen.length}</p>
              <p className="text-sm text-blue-900">{hilfen[hilfeIndex]}</p>
              {hilfeIndex < hilfen.length - 1 && (
                <button onClick={() => setHilfeIndex((h) => h + 1)}
                  className="text-xs text-blue-600 hover:underline mt-2">
                  Weitere Hilfe
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <button
          onClick={submit}
          disabled={selected.size === 0}
          className="self-start bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          Antwort abgeben
        </button>
      )}
    </div>
  )
}
