'use client'

import { useState, useCallback } from 'react'
import { MultipleChoice } from './MultipleChoice'
import { Zuordnung } from './Zuordnung'

type Differenzierungsniveau = 'leichter' | 'mittel' | 'schwer' | 'sehr_schwer'

interface DiffStufe {
  aufgabentext_variante: string | null
  hilfen: string[]
  distraktoren: string[]
}

interface Aufgabe {
  aufgabe_id: string
  text: string
  antwortformat: string
  loesungen: string[]
  teilloesungen?: string[]
  differenzierungen?: Record<Differenzierungsniveau, DiffStufe>
  fehlvorstellungen?: { fehler: string; fehlvorstellung_dahinter: string }[]
  feedbackbausteine?: { bei_korrekt: string; bei_falsch: string }
  teilkompetenz?: string
}

interface Props {
  sessionId: string
  aufgaben: Aufgabe[]
  niveau: Differenzierungsniveau
  gameSkin: string
}

interface AufgabenErgebnis {
  aufgabeId: string
  antworten: string[]
  korrekt: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildOptionen(aufgabe: Aufgabe, niveau: Differenzierungsniveau) {
  const diff = aufgabe.differenzierungen?.[niveau]
  const distraktoren = diff?.distraktoren ?? []
  const loesungen = aufgabe.loesungen
  return shuffle([
    ...loesungen.map((l) => ({ text: l, isCorrect: true })),
    ...distraktoren.map((d) => ({ text: d, isCorrect: false })),
  ])
}

function buildPaare(aufgabe: Aufgabe, niveau: Differenzierungsniveau) {
  // Für Zuordnung: loesungen als "Begriff → Definition" Strings parsen
  const diff = aufgabe.differenzierungen?.[niveau]
  const distraktoren = diff?.distraktoren ?? []

  // Versuche "X → Y" Format zu parsen
  const paare = aufgabe.loesungen
    .map((l) => {
      const parts = l.split(/\s*[→\-:]\s*/)
      return parts.length >= 2
        ? { links: parts[0].trim(), rechts: parts.slice(1).join(' → ').trim() }
        : null
    })
    .filter(Boolean) as { links: string; rechts: string }[]

  // Fallback: wenn keine Paar-Struktur erkannt → als MC behandeln
  if (paare.length === 0) return null

  return paare
}

export function GameEngine({ sessionId, aufgaben, niveau, gameSkin }: Props) {
  const [current, setCurrent] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<AufgabenErgebnis[]>([])
  const [abgeschlossen, setAbgeschlossen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const aufgabe = aufgaben[current]
  const fortschritt = Math.round((current / aufgaben.length) * 100)

  const handleAntwort = useCallback(async (antworten: string[], korrekt: boolean) => {
    const neueErgebnisse = [...ergebnisse, { aufgabeId: aufgabe.aufgabe_id, antworten, korrekt }]
    setErgebnisse(neueErgebnisse)

    // Antwort speichern
    setSubmitting(true)
    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          aufgabeId: aufgabe.aufgabe_id,
          antwortWert: antworten,
        }),
      })
    } catch { /* Fehler ignorieren — Spiel läuft weiter */ }
    setSubmitting(false)

    // Weiter nach 1.5s
    setTimeout(() => {
      if (current + 1 >= aufgaben.length) {
        setAbgeschlossen(true)
      } else {
        setCurrent((c) => c + 1)
      }
    }, 1500)
  }, [aufgabe, current, aufgaben.length, ergebnisse, sessionId])

  // Ergebnis-Screen
  if (abgeschlossen) {
    const korrektAnzahl = ergebnisse.filter((e) => e.korrekt).length
    const prozent = Math.round((korrektAnzahl / aufgaben.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
        <div className="text-5xl">{prozent >= 80 ? '🌟' : prozent >= 50 ? '💪' : '📚'}</div>
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {korrektAnzahl} von {aufgaben.length} richtig
          </h2>
          <p className="text-muted-foreground text-sm">
            {prozent >= 80
              ? 'Ausgezeichnet — du beherrschst dieses Thema sehr gut!'
              : prozent >= 50
              ? 'Gut — mit etwas Übung kannst du noch mehr erreichen.'
              : 'Nicht aufgeben — wiederhole das Material und versuche es nochmal.'}
          </p>
        </div>

        {/* Aufgaben-Feedback */}
        <div className="w-full max-w-md text-left flex flex-col gap-2">
          {ergebnisse.map((e, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm border
              ${e.korrekt ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}>
              <span className="flex-shrink-0">{e.korrekt ? '✓' : '✗'}</span>
              <span className={e.korrekt ? 'text-green-800' : 'text-red-800'}>
                Aufgabe {i + 1}: {e.korrekt ? 'Richtig' : 'Falsch'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Skin-Header
  const skinLabel: Record<string, string> = {
    unterstufe: '🐾 Lern-Abenteuer',
    mittelstufe: '🚀 Mission',
    oberstufe: '📊 Analyse',
  }

  const diff = aufgabe.differenzierungen?.[niveau]
  const hilfen = diff?.hilfen ?? []
  const feedbackbausteine = aufgabe.feedbackbausteine ?? { bei_korrekt: 'Richtig!', bei_falsch: 'Leider falsch.' }
  const aufgabenText = diff?.aufgabentext_variante ?? aufgabe.text

  // Game-Engine-Auswahl nach Antwortformat
  const format = aufgabe.antwortformat
  const isZuordnung = format === 'zuordnung' || format === 'drag_and_drop'
  const isMehrfach = format === 'multiple_choice'

  const paare = isZuordnung ? buildPaare(aufgabe, niveau) : null
  const optionen = !isZuordnung || !paare ? buildOptionen(aufgabe, niveau) : []

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{skinLabel[gameSkin] ?? 'Spiel'}</span>
        <span className="text-xs text-muted-foreground">Aufgabe {current + 1} / {aufgaben.length}</span>
      </div>

      {/* Fortschritt */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${fortschritt}%` }} />
      </div>

      {/* Aufgabe */}
      <div className="border rounded-2xl p-6">
        {isZuordnung && paare ? (
          <Zuordnung
            text={aufgabenText}
            paare={paare}
            hilfen={hilfen}
            feedback={feedbackbausteine}
            onAntwort={handleAntwort}
          />
        ) : (
          <MultipleChoice
            aufgabeId={aufgabe.aufgabe_id}
            text={aufgabenText}
            optionen={optionen}
            mehrfach={isMehrfach}
            hilfen={hilfen}
            feedback={feedbackbausteine}
            onAntwort={handleAntwort}
          />
        )}
      </div>

      {submitting && (
        <p className="text-xs text-muted-foreground text-center">Speichern…</p>
      )}
    </div>
  )
}
