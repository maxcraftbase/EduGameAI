'use client'

import { useState, useTransition } from 'react'
import { UploadZone } from '@/components/playground/UploadZone'
import { LehrkraftCheckPanel } from '@/components/playground/LehrkraftCheckPanel'

type Step = 'upload' | 'metadata' | 'analysing' | 'result' | 'error'

const ANALYSE_SCHRITTE = [
  'Material analysieren',
  'Kernaussagen extrahieren',
  'Wissensform bestimmen',
  'Lernform bestimmen',
  'Wissensstruktur bestimmen',
  'Komplexitätsstufe bestimmen',
  'Lernziel formulieren',
  'Spielbarkeit prüfen',
  'Ampel-Entscheidung',
  'Antwortformat bestimmen',
  'Game-Engine wählen',
  'Game-Skin wählen',
  'Spieltyp benennen',
  'Aufgaben generieren',
  'Differenzierung erzeugen',
  'Fehlvorstellungen einbauen',
  'Feedbackbausteine erstellen',
  'Fachliche Reduktion prüfen',
  'Fachliche Korrektheit prüfen',
  'Sourcemapping erstellen',
  'Lehrkraft-Check ausgeben',
]

const FAECHER = ['Biologie', 'Chemie', 'Physik', 'Mathematik', 'Deutsch', 'Geschichte',
  'Geographie', 'Politik', 'Philosophie', 'Englisch', 'Latein', 'Kunst', 'Musik', 'Sport', 'Informatik']
const STUFEN = Array.from({ length: 9 }, (_, i) => `${i + 5}`)
const SCHULFORMEN = ['Gymnasium', 'Realschule', 'Gesamtschule', 'Berufsschule', 'Grundschule']
const BUNDESLAENDER = ['NRW', 'Bayern', 'Berlin', 'Hamburg', 'Hessen', 'Baden-Württemberg',
  'Sachsen', 'Niedersachsen', 'Brandenburg', 'Thüringen', 'Sachsen-Anhalt', 'Mecklenburg-Vorpommern',
  'Rheinland-Pfalz', 'Saarland', 'Schleswig-Holstein', 'Bremen']

interface AnalyseResult {
  spielId: string
  result: {
    lernziel: {
      schritt_7_lernziel: { original: string }
      schritt_9_ampel: { farbe: string; lernziel_mvp_variante: string | null }
    }
    check: {
      schritt_21_lehrkraft_check: {
        gesamtampel: 'gruen' | 'gelb' | 'rot'
        lernziel_original: string
        lernziel_mvp_variante: string | null
        dimensionen: Record<string, unknown>
        lernzielanteile: { vollstaendig_abgedeckt: string[]; teilweise_abgedeckt: string[]; nicht_abgedeckt: string[] }
        hinweise_fuer_lehrkraft: string[]
        spielfunktion: string
        begruendung_anpassungen: string | null
      }
    }
  }
}

export default function PlaygroundPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [laufenderSchritt, setLaufenderSchritt] = useState(0)
  const [analyseResult, setAnalyseResult] = useState<AnalyseResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Schritt 1: Datei gewählt → zu Metadata
  function onFile(f: File) {
    setFile(f)
    setStep('metadata')
  }

  // Schritt 2: Metadata ausgefüllt → Upload + Analyse starten
  function onSubmitMetadata(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fach = (form.elements.namedItem('fach') as HTMLSelectElement).value
    const jahrgangsstufe = (form.elements.namedItem('jahrgangsstufe') as HTMLSelectElement).value
    const schulform = (form.elements.namedItem('schulform') as HTMLSelectElement).value
    const bundesland = (form.elements.namedItem('bundesland') as HTMLSelectElement).value
    const lernziel = (form.elements.namedItem('lernziel') as HTMLInputElement).value
    const zeitrahmen = parseInt((form.elements.namedItem('zeitrahmen') as HTMLInputElement).value) || 15

    startTransition(async () => {
      setStep('analysing')
      setErrorMsg(null)

      // Simulated Schritt-Fortschritt während die Pipeline läuft
      const interval = setInterval(() => {
        setLaufenderSchritt((s) => Math.min(s + 1, ANALYSE_SCHRITTE.length - 1))
      }, 3000)

      try {
        // 1. Upload
        const formData = new FormData()
        formData.append('file', file!)
        formData.append('fach', fach)
        formData.append('jahrgangsstufe', jahrgangsstufe)
        formData.append('schulform', schulform)
        formData.append('bundesland', bundesland)

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!uploadRes.ok) throw new Error('Upload fehlgeschlagen')
        const { material } = await uploadRes.json()

        // 2. Analyse
        const analyseRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId: material.id,
            lernzielLehrkraft: lernziel || undefined,
            zeitrahmenMinuten: zeitrahmen,
          }),
        })
        if (!analyseRes.ok) {
          const body = await analyseRes.json()
          throw new Error(body.error ?? 'Analyse fehlgeschlagen')
        }
        const data = await analyseRes.json()

        clearInterval(interval)
        setLaufenderSchritt(ANALYSE_SCHRITTE.length)
        setAnalyseResult({ spielId: data.spielId, result: data.result })
        setStep('result')
      } catch (err) {
        clearInterval(interval)
        setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler')
        setStep('error')
      }
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Playground</h1>
      <p className="text-muted-foreground mb-8 text-sm">Material hochladen → KI analysiert → Spiel generieren</p>

      {/* Schritt 1: Upload */}
      {step === 'upload' && (
        <UploadZone onFile={onFile} />
      )}

      {/* Schritt 2: Metadata */}
      {step === 'metadata' && file && (
        <form onSubmit={onSubmitMetadata} className="flex flex-col gap-5">
          <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-3">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={() => setStep('upload')} className="text-xs text-muted-foreground hover:text-foreground">
              Ändern
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fach</label>
              <select name="fach" required className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="">Bitte wählen</option>
                {FAECHER.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jahrgangsstufe</label>
              <select name="jahrgangsstufe" required className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="">Bitte wählen</option>
                {STUFEN.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Schulform</label>
              <select name="schulform" required className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="">Bitte wählen</option>
                {SCHULFORMEN.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bundesland</label>
              <select name="bundesland" required className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="">Bitte wählen</option>
                {BUNDESLAENDER.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Zeitrahmen (Minuten)
            </label>
            <input name="zeitrahmen" type="number" defaultValue={15} min={5} max={90}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Eigenes Lernziel <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input name="lernziel" type="text" placeholder="Die Schüler können… indem sie…"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            <p className="text-xs text-muted-foreground mt-1">
              Ohne Angabe formuliert die KI ein Lernziel aus dem Material.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Spiel generieren →
          </button>
        </form>
      )}

      {/* Schritt 3: Analyse läuft */}
      {step === 'analysing' && (
        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground mb-2">KI analysiert Ihr Material in 21 Schritten…</div>
          <div className="flex flex-col gap-1.5">
            {ANALYSE_SCHRITTE.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${i < laufenderSchritt ? 'text-green-700' : i === laufenderSchritt ? 'bg-primary/5 text-primary font-medium' : 'text-muted-foreground'}`}>
                <span className="w-5 text-center flex-shrink-0">
                  {i < laufenderSchritt ? '✓' : i === laufenderSchritt ? '⟳' : `${i + 1}`}
                </span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schritt 4: Ergebnis + Lehrkraft-Check */}
      {step === 'result' && analyseResult && (
        <div className="flex flex-col gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-green-800">
              ✅ Spiel generiert — bitte prüfen und freigeben.
            </p>
            <a href={`/modules/${analyseResult.spielId}`}
               className="text-xs text-green-700 hover:underline mt-1 block">
              → Zum Modul wechseln
            </a>
          </div>
          <LehrkraftCheckPanel
            spielId={analyseResult.spielId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            check={analyseResult.result.check.schritt_21_lehrkraft_check as any}
          />
        </div>
      )}

      {/* Fehler */}
      {step === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-medium text-red-800 mb-1">Fehler</p>
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button onClick={() => setStep('upload')}
            className="mt-4 text-sm text-red-700 hover:underline">
            ← Neu versuchen
          </button>
        </div>
      )}
    </div>
  )
}
