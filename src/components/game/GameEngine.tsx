'use client'

import { useState, useCallback } from 'react'
import { MultipleChoice } from './MultipleChoice'
import { Zuordnung } from './Zuordnung'
import { Reihenfolge } from './Reihenfolge'
import { Hangman } from './Hangman'
import { SpaceInvaders } from './SpaceInvaders'
import { BossFight } from './BossFight'
import { SprintQuiz } from './SprintQuiz'
import { EscapeRoom } from './EscapeRoom'

interface Aufgabe {
  aufgabe_id: string
  text: string
  antwortformat: string
  loesungen: string[]
  distraktoren?: string[]
  hilfen?: string[]
  teilkompetenz?: string
}

interface Props {
  sessionId: string
  aufgaben: Aufgabe[]
  niveau: string
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

function buildOptionen(aufgabe: Aufgabe) {
  return shuffle([
    ...aufgabe.loesungen.map((l) => ({ text: l, isCorrect: true })),
    ...(aufgabe.distraktoren ?? []).map((d) => ({ text: d, isCorrect: false })),
  ])
}

function parsePaare(aufgabe: Aufgabe) {
  const paare = aufgabe.loesungen
    .map((l) => {
      const parts = l.split(/\s*[→\-:]\s*/)
      return parts.length >= 2
        ? { links: parts[0].trim(), rechts: parts.slice(1).join(' → ').trim() }
        : null
    })
    .filter(Boolean) as { links: string; rechts: string }[]
  return paare.length > 0 ? paare : null
}

const SKIN_LABEL: Record<string, string> = {
  unterstufe: '🐾 Lern-Abenteuer',
  mittelstufe: '🚀 Mission',
  oberstufe: '📊 Analyse',
  // Neue Skins
  'Boss Battle': '⚔️ Boss Fight',
  'Sprint-Bahn': '🏃 Sprint',
  'Escape Room': '🔐 Escape',
  'Detective Room': '🔍 Detektiv',
  'Radar-Scanner': '📡 Radar',
  'Puzzle-Karte': '🗺️ Puzzle',
  'Entdeckerkarte': '🧩 Entdecken',
  'Story-Fork': '📖 Story',
  'Werkstatt-Band': '🏭 Werkstatt',
  'Flow-Kette': '⛓️ Prozess',
  'Werkzeugkasten': '🔧 Begriffe',
  'Fehler-Scanner': '🔬 Fehler',
  'Waage': '⚖️ Kriterien',
  'Arena': '🏆 Gauntlet',
}

export function GameEngine({ sessionId, aufgaben, gameSkin }: Props) {
  const [current, setCurrent] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<AufgabenErgebnis[]>([])
  const [abgeschlossen, setAbgeschlossen] = useState(false)
  const [bereit, setBereit] = useState(false)

  const aufgabe = aufgaben[current]
  const fortschritt = Math.round((current / aufgaben.length) * 100)

  const handleAntwort = useCallback(async (antworten: string[], korrekt: boolean) => {
    setErgebnisse((prev) => [...prev, { aufgabeId: aufgabe.aufgabe_id, antworten, korrekt }])

    try {
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, aufgabeId: aufgabe.aufgabe_id, antwortWert: antworten }),
      })
    } catch { /* Spiel läuft weiter */ }

    setBereit(true)
  }, [aufgabe, sessionId])

  function weiter() {
    setBereit(false)
    if (current + 1 >= aufgaben.length) setAbgeschlossen(true)
    else setCurrent((c) => c + 1)
  }

  if (abgeschlossen) {
    const korrektAnzahl = ergebnisse.filter((e) => e.korrekt).length
    const prozent = Math.round((korrektAnzahl / aufgaben.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
        <div className="text-5xl">{prozent >= 80 ? '🌟' : prozent >= 50 ? '💪' : '📚'}</div>
        <div>
          <h2 className="text-2xl font-bold mb-1">{korrektAnzahl} von {aufgaben.length} richtig</h2>
          <p className="text-muted-foreground text-sm">
            {prozent >= 80 ? 'Ausgezeichnet — du beherrschst dieses Thema sehr gut!'
              : prozent >= 50 ? 'Gut — mit etwas Übung kannst du noch mehr erreichen.'
              : 'Nicht aufgeben — wiederhole das Material und versuche es nochmal.'}
          </p>
        </div>
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

  const hilfen = aufgabe.hilfen ?? []
  const feedback = { bei_korrekt: 'Richtig!', bei_falsch: 'Leider falsch.' }
  const format = aufgabe.antwortformat

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{SKIN_LABEL[gameSkin] ?? 'Spiel'}</span>
        <span className="text-xs text-muted-foreground">Aufgabe {current + 1} / {aufgaben.length}</span>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${fortschritt}%` }} />
      </div>

      <div key={current} className="border rounded-2xl p-6">
        {format === 'hangman' ? (
          <Hangman
            text={aufgabe.text}
            wort={aufgabe.loesungen[0] ?? ''}
            hilfen={hilfen}
            feedback={feedback}
            onAntwort={handleAntwort}
          />
        ) : format === 'space_invaders' ? (
          <SpaceInvaders
            text={aufgabe.text}
            loesungen={aufgabe.loesungen}
            distraktoren={aufgabe.distraktoren ?? []}
            feedback={feedback}
            onAntwort={handleAntwort}
          />
        ) : format === 'boss_fight' ? (
          <BossFight
            text={aufgabe.text}
            optionen={buildOptionen(aufgabe)}
            onAntwort={handleAntwort}
          />
        ) : format === 'sprint_quiz' ? (
          <SprintQuiz
            text={aufgabe.text}
            optionen={buildOptionen(aufgabe)}
            onAntwort={handleAntwort}
          />
        ) : format === 'escape_room' ? (
          <EscapeRoom
            text={aufgabe.text}
            optionen={buildOptionen(aufgabe)}
            schlossNummer={current + 1}
            gesamtSchloesser={aufgaben.length}
            onAntwort={handleAntwort}
          />
        ) : format === 'reihenfolge' ? (
          <Reihenfolge
            text={aufgabe.text}
            richtigeReihenfolge={aufgabe.loesungen}
            hilfen={hilfen}
            feedback={feedback}
            onAntwort={handleAntwort}
          />
        ) : format === 'zuordnung' ? (
          (() => {
            const paare = parsePaare(aufgabe)
            return paare ? (
              <Zuordnung
                text={aufgabe.text}
                paare={paare}
                hilfen={hilfen}
                feedback={feedback}
                onAntwort={handleAntwort}
              />
            ) : (
              <MultipleChoice
                aufgabeId={aufgabe.aufgabe_id}
                text={aufgabe.text}
                optionen={buildOptionen(aufgabe)}
                mehrfach={false}
                hilfen={hilfen}
                feedback={feedback}
                onAntwort={handleAntwort}
              />
            )
          })()
        ) : (
          <MultipleChoice
            aufgabeId={aufgabe.aufgabe_id}
            text={aufgabe.text}
            optionen={buildOptionen(aufgabe)}
            mehrfach={format === 'multiple_choice'}
            hilfen={hilfen}
            feedback={feedback}
            onAntwort={handleAntwort}
          />
        )}
      </div>

      {bereit && (
        <button
          onClick={weiter}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
        >
          {current + 1 >= aufgaben.length ? 'Auswertung ansehen →' : 'Weiter →'}
        </button>
      )}
    </div>
  )
}
