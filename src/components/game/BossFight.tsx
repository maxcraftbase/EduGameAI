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
  onAntwort: (antworten: string[], korrekt: boolean) => void
}

const MAX_LEBEN = 3

export function BossFight({ text, optionen, onAntwort }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [leben, setLeben] = useState(MAX_LEBEN)
  const [bossHp, setBossHp] = useState(100)
  const [bossAngegriffen, setBossAngegriffen] = useState(false)
  const [spielerGetroffen, setSpielerGetroffen] = useState(false)

  function waehle(i: number) {
    if (submitted) return
    setSelected(i)
  }

  function submit() {
    if (selected === null || submitted) return
    setSubmitted(true)
    const korrekt = optionen[selected].isCorrect

    if (korrekt) {
      setBossAngegriffen(true)
      setBossHp((hp) => Math.max(0, hp - 25))
      setTimeout(() => setBossAngegriffen(false), 500)
    } else {
      setSpielerGetroffen(true)
      setLeben((l) => Math.max(0, l - 1))
      setTimeout(() => setSpielerGetroffen(false), 500)
    }

    setTimeout(() => {
      onAntwort([optionen[selected].text], korrekt)
    }, 800)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Boss */}
      <div className={cn(
        'flex flex-col items-center gap-2 transition-transform duration-150',
        bossAngegriffen && 'translate-x-2 opacity-60'
      )}>
        <div className="text-6xl select-none">👾</div>
        <div className="w-full max-w-[200px] h-2 bg-red-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-500"
            style={{ width: `${bossHp}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">Boss HP: {bossHp}%</span>
      </div>

      {/* Frage */}
      <div className={cn(
        'px-4 py-3 rounded-xl bg-muted/50 text-sm font-medium text-center transition-transform duration-150',
        spielerGetroffen && 'translate-x-[-4px] bg-red-50'
      )}>
        {text}
      </div>

      {/* Antwortoptionen */}
      <div className="grid grid-cols-1 gap-2">
        {optionen.map((opt, i) => {
          const isSelected = selected === i
          const showResult = submitted && isSelected

          return (
            <button
              key={i}
              onClick={() => waehle(i)}
              disabled={submitted}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                !submitted && 'hover:border-purple-400 hover:bg-purple-50',
                isSelected && !submitted && 'border-purple-500 bg-purple-50',
                showResult && opt.isCorrect && 'border-green-500 bg-green-50 text-green-800',
                showResult && !opt.isCorrect && 'border-red-400 bg-red-50 text-red-800',
                submitted && !isSelected && 'opacity-40 cursor-default',
              )}
            >
              {opt.text}
            </button>
          )
        })}
      </div>

      {/* Spielerleben */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Deine Leben:</span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_LEBEN }).map((_, i) => (
            <span key={i} className={cn('text-base', i < leben ? 'opacity-100' : 'opacity-20')}>❤️</span>
          ))}
        </div>
      </div>

      {!submitted && selected !== null && (
        <button
          onClick={submit}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #DC2626, #7C3AED)' }}
        >
          ⚔️ Angreifen
        </button>
      )}

      {submitted && (
        <div className={cn(
          'text-center text-sm font-semibold py-2 rounded-xl',
          optionen[selected!]?.isCorrect ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
        )}>
          {optionen[selected!]?.isCorrect ? '⚔️ Treffer! Der Boss ist geschwächt.' : '💥 Boss kontert! Aufgepasst.'}
        </div>
      )}
    </div>
  )
}
