'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Option {
  text: string
  isCorrect: boolean
}

interface Props {
  text: string
  optionen: Option[]
  schlossNummer: number
  gesamtSchloesser: number
  onAntwort: (antworten: string[], korrekt: boolean) => void
}

const MAX_VERSUCHE = 2

export function EscapeRoom({ text, optionen, schlossNummer, gesamtSchloesser, onAntwort }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [versuche, setVersuche] = useState(0)
  const [entsperrt, setEntsprerrt] = useState(false)
  const [falschangezeigt, setFalschAngezeigt] = useState(false)

  function waehle(i: number) {
    if (submitted) return
    setSelected(i)
  }

  function submit() {
    if (selected === null || submitted) return
    const korrekt = optionen[selected].isCorrect
    const neueVersuche = versuche + 1

    if (korrekt) {
      setSubmitted(true)
      setEntsprerrt(true)
      setTimeout(() => onAntwort([optionen[selected!].text], true), 900)
    } else {
      setFalschAngezeigt(true)
      setVersuche(neueVersuche)
      setSelected(null)
      setTimeout(() => setFalschAngezeigt(false), 800)

      if (neueVersuche >= MAX_VERSUCHE) {
        setSubmitted(true)
        setTimeout(() => onAntwort([optionen[selected!].text], false), 900)
      }
    }
  }

  const verbleibendVersuche = MAX_VERSUCHE - versuche

  return (
    <div className="flex flex-col gap-5">
      {/* Schloss-Fortschritt */}
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: gesamtSchloesser }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'text-xl transition-all',
              i < schlossNummer - 1 ? 'opacity-100' : i === schlossNummer - 1 ? 'scale-125' : 'opacity-20'
            )}
          >
            {i < schlossNummer - 1 ? '🔓' : i === schlossNummer - 1 ? '🔐' : '🔒'}
          </span>
        ))}
      </div>

      {/* Rätsel-Frage */}
      <div className={cn(
        'px-4 py-4 rounded-xl text-sm font-medium text-center transition-all duration-150',
        'bg-slate-900 text-slate-100',
        falschangezeigt && 'border-2 border-red-500 shake',
      )}>
        <div className="text-xs text-slate-400 mb-2">🔐 Schloss {schlossNummer} von {gesamtSchloesser}</div>
        {text}
      </div>

      {/* Versuche */}
      {!submitted && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Versuche:</span>
          <div className="flex gap-1">
            {Array.from({ length: MAX_VERSUCHE }).map((_, i) => (
              <span key={i} className={cn('text-sm', i < verbleibendVersuche ? 'opacity-100' : 'opacity-20')}>🗝️</span>
            ))}
          </div>
        </div>
      )}

      {/* Antwortoptionen */}
      {!entsperrt && (
        <div className="grid grid-cols-1 gap-2">
          {optionen.map((opt, i) => {
            const isSelected = selected === i

            return (
              <button
                key={i}
                onClick={() => waehle(i)}
                disabled={submitted}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                  !submitted && 'hover:border-slate-500 hover:bg-slate-50',
                  isSelected && !submitted && 'border-slate-600 bg-slate-50',
                  submitted && 'opacity-40 cursor-default',
                )}
              >
                {opt.text}
              </button>
            )
          })}
        </div>
      )}

      {/* Entsperrt-Animation */}
      {entsperrt && (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="text-4xl animate-bounce">🔓</div>
          <p className="text-sm font-semibold text-green-700">Schloss geöffnet! Weiter!</p>
        </div>
      )}

      {/* Falsch-Feedback */}
      {falschangezeigt && (
        <div className="text-center text-sm font-semibold py-2 rounded-xl text-red-700 bg-red-50">
          ❌ Nicht der richtige Code — versuch es nochmal.
        </div>
      )}

      {submitted && !entsperrt && (
        <div className="text-center text-sm font-semibold py-2 rounded-xl text-orange-700 bg-orange-50">
          🔒 Schloss nicht geöffnet. Nächstes Rätsel.
        </div>
      )}

      {!submitted && selected !== null && (
        <button
          onClick={submit}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #1E293B, #7C3AED)' }}
        >
          🗝️ Code eingeben
        </button>
      )}
    </div>
  )
}
