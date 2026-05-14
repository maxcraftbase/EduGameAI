'use client'

import { useState, useEffect } from 'react'

const MAX_FEHLER = 6

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface Props {
  text: string
  wort: string          // loesungen[0]
  hilfen: string[]
  feedback: { bei_korrekt: string; bei_falsch: string }
  onAntwort: (antworten: string[], korrekt: boolean) => void
}

function HangmanSVG({ fehler }: { fehler: number }) {
  return (
    <svg viewBox="0 0 120 140" className="w-32 h-40" strokeLinecap="round" strokeLinejoin="round">
      {/* Galgen */}
      <line x1="10" y1="130" x2="110" y2="130" stroke="#6B7280" strokeWidth="3" />
      <line x1="30" y1="130" x2="30" y2="10" stroke="#6B7280" strokeWidth="3" />
      <line x1="30" y1="10" x2="75" y2="10" stroke="#6B7280" strokeWidth="3" />
      <line x1="75" y1="10" x2="75" y2="25" stroke="#6B7280" strokeWidth="3" />
      {/* Kopf */}
      {fehler >= 1 && <circle cx="75" cy="35" r="10" stroke="#1F1235" strokeWidth="2.5" fill="none" />}
      {/* Körper */}
      {fehler >= 2 && <line x1="75" y1="45" x2="75" y2="85" stroke="#1F1235" strokeWidth="2.5" />}
      {/* Linker Arm */}
      {fehler >= 3 && <line x1="75" y1="55" x2="55" y2="70" stroke="#1F1235" strokeWidth="2.5" />}
      {/* Rechter Arm */}
      {fehler >= 4 && <line x1="75" y1="55" x2="95" y2="70" stroke="#1F1235" strokeWidth="2.5" />}
      {/* Linkes Bein */}
      {fehler >= 5 && <line x1="75" y1="85" x2="55" y2="110" stroke="#1F1235" strokeWidth="2.5" />}
      {/* Rechtes Bein */}
      {fehler >= 6 && <line x1="75" y1="85" x2="95" y2="110" stroke="#1F1235" strokeWidth="2.5" />}
    </svg>
  )
}

export function Hangman({ text, wort, hilfen, feedback, onAntwort }: Props) {
  const word = wort.toUpperCase()
  const [geraten, setGeraten] = useState<Set<string>>(new Set())
  const [hilfeIndex, setHilfeIndex] = useState<number | null>(null)
  const [fertig, setFertig] = useState(false)

  const fehler = [...geraten].filter((b) => !word.includes(b)).length
  const gewonnen = word.split('').every((b) => b === ' ' || geraten.has(b))
  const verloren = fehler >= MAX_FEHLER

  useEffect(() => {
    if ((gewonnen || verloren) && !fertig) {
      setFertig(true)
      setTimeout(() => onAntwort([[...geraten].join(',')], gewonnen), 1200)
    }
  }, [gewonnen, verloren, fertig, geraten, onAntwort])

  function rateBuchstabe(b: string) {
    if (fertig || geraten.has(b)) return
    setGeraten((prev) => new Set([...prev, b]))
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium leading-relaxed text-center">{text}</p>

      <div className="flex justify-center">
        <HangmanSVG fehler={fehler} />
      </div>

      {/* Fehlerzähler */}
      <div className="flex justify-center gap-1">
        {Array.from({ length: MAX_FEHLER }).map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i < fehler ? 'bg-red-400' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Wort-Anzeige */}
      <div className="flex justify-center flex-wrap gap-2 my-2">
        {word.split('').map((b, i) =>
          b === ' ' ? (
            <div key={i} className="w-4" />
          ) : (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-lg font-bold w-7 text-center" style={{ color: '#1F1235' }}>
                {geraten.has(b) ? b : ' '}
              </span>
              <div className="w-7 h-0.5 bg-gray-400" />
            </div>
          )
        )}
      </div>

      {/* Feedback */}
      {fertig && (
        <div className={`text-sm px-4 py-3 rounded-xl font-medium text-center
          ${gewonnen ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {gewonnen ? feedback.bei_korrekt : `${feedback.bei_falsch} Das Wort war: ${word}`}
        </div>
      )}

      {/* Hilfen */}
      {hilfen.length > 0 && fehler >= 2 && !fertig && (
        <div className="flex gap-2 items-center justify-center">
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

      {/* Alphabet */}
      {!fertig && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-1">
          {ALPHABET.map((b) => {
            const benutzt = geraten.has(b)
            const richtig = benutzt && word.includes(b)
            const falsch = benutzt && !word.includes(b)
            return (
              <button
                key={b}
                onClick={() => rateBuchstabe(b)}
                disabled={benutzt}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                  ${richtig ? 'bg-green-100 text-green-700 border border-green-300'
                    : falsch ? 'bg-red-100 text-red-400 border border-red-200 line-through'
                    : 'bg-gray-100 hover:bg-violet-100 hover:text-violet-700 border border-gray-200'}`}
              >
                {b}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
