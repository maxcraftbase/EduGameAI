'use client'

import { useState, useEffect } from 'react'

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
      // Tausche selected ↔ i
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

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium leading-relaxed">{text}</p>

      {hilfen.length > 0 && (
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

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const isSelected = selected === i
          const isCorrectPos = submitted && item === richtigeReihenfolge[i]
          const isWrongPos = submitted && item !== richtigeReihenfolge[i]
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={submitted}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all
                ${isSelected ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-300'
                  : isCorrectPos ? 'border-green-400 bg-green-50'
                  : isWrongPos ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isCorrectPos ? 'bg-green-500 text-white'
                  : isWrongPos ? 'bg-red-400 text-white'
                  : isSelected ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 text-gray-500'}`}>
                {submitted ? (isCorrectPos ? '✓' : '✗') : i + 1}
              </span>
              <span className={isCorrectPos ? 'text-green-800' : isWrongPos ? 'text-red-700' : ''}>{item}</span>
            </button>
          )
        })}
      </div>

      {submitted && (
        <div className={`text-sm px-4 py-3 rounded-xl font-medium
          ${korrekt ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {korrekt ? feedback.bei_korrekt : feedback.bei_falsch}
          {!korrekt && (
            <div className="mt-2 text-xs opacity-80">
              Richtige Reihenfolge: {richtigeReihenfolge.join(' → ')}
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <p className="text-xs text-gray-400 text-center">
          Tippe auf zwei Elemente um sie zu tauschen
        </p>
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
