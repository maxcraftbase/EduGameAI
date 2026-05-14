'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Option {
  text: string
  isCorrect: boolean
}

interface Props {
  text: string
  optionen: Option[]
  zeitSekunden?: number
  onAntwort: (antworten: string[], korrekt: boolean) => void
}

const DEFAULT_ZEIT = 20

export function SprintQuiz({ text, optionen, zeitSekunden = DEFAULT_ZEIT, onAntwort }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [verbleibend, setVerbleibend] = useState(zeitSekunden)
  const [zeitAbgelaufen, setZeitAbgelaufen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onAntwortRef = useRef(onAntwort)
  useEffect(() => { onAntwortRef.current = onAntwort }, [onAntwort])

  const handleTimeout = useCallback(() => {
    setZeitAbgelaufen(true)
    setSubmitted(true)
    setTimeout(() => onAntwortRef.current([], false), 400)
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVerbleibend((v) => {
        if (v <= 1) {
          clearInterval(intervalRef.current!)
          handleTimeout()
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [handleTimeout])

  function waehle(i: number) {
    if (submitted) return
    setSelected(i)
  }

  function submit() {
    if (selected === null || submitted) return
    clearInterval(intervalRef.current!)
    setSubmitted(true)
    const korrekt = optionen[selected].isCorrect
    setTimeout(() => onAntwort([optionen[selected!].text], korrekt), 600)
  }

  const prozent = Math.round((verbleibend / zeitSekunden) * 100)
  const timerFarbe = verbleibend > 10 ? 'bg-green-500' : verbleibend > 5 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex flex-col gap-5">
      {/* Timer */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">🏃 Sprint-Quiz</span>
        <span className={cn(
          'text-sm font-bold tabular-nums',
          verbleibend <= 5 && 'text-red-600 animate-pulse',
          verbleibend > 5 && verbleibend <= 10 && 'text-yellow-600',
          verbleibend > 10 && 'text-green-700',
        )}>
          {verbleibend}s
        </span>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', timerFarbe)}
          style={{ width: `${prozent}%` }}
        />
      </div>

      {/* Frage */}
      <div className="px-4 py-3 rounded-xl bg-muted/50 text-sm font-medium text-center">
        {text}
      </div>

      {/* Antworten */}
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
                !submitted && 'hover:border-amber-400 hover:bg-amber-50',
                isSelected && !submitted && 'border-amber-500 bg-amber-50',
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

      {zeitAbgelaufen && (
        <div className="text-center text-sm font-semibold py-2 rounded-xl text-red-700 bg-red-50">
          ⏱️ Zeit abgelaufen!
        </div>
      )}

      {!submitted && !zeitAbgelaufen && selected !== null && (
        <button
          onClick={submit}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #D97706, #DC2626)' }}
        >
          🏁 Antworten
        </button>
      )}

      {submitted && !zeitAbgelaufen && (
        <div className={cn(
          'text-center text-sm font-semibold py-2 rounded-xl',
          optionen[selected!]?.isCorrect ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
        )}>
          {optionen[selected!]?.isCorrect
            ? `✅ Richtig! (${zeitSekunden - verbleibend}s)`
            : '❌ Falsch'}
        </div>
      )}
    </div>
  )
}
