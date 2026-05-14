'use client'

import { useState, useTransition } from 'react'
import { UploadZone } from '@/components/playground/UploadZone'
import { LehrkraftCheckPanel } from '@/components/playground/LehrkraftCheckPanel'

type Step = 'upload' | 'metadata' | 'analysing' | 'result' | 'error'

const ANALYSE_SCHRITTE = [
  'Material analysieren', 'Kernaussagen extrahieren', 'Wissensform bestimmen',
  'Lernform bestimmen', 'Wissensstruktur bestimmen', 'Komplexitätsstufe bestimmen',
  'Lernziel formulieren', 'Spielbarkeit prüfen', 'Ampel-Entscheidung',
  'Antwortformat bestimmen', 'Game-Engine wählen', 'Game-Skin wählen',
  'Spieltyp benennen', 'Aufgaben generieren', 'Differenzierung erzeugen',
  'Fehlvorstellungen einbauen', 'Feedbackbausteine erstellen',
  'Fachliche Reduktion prüfen', 'Fachliche Korrektheit prüfen',
  'Sourcemapping erstellen', 'Lehrkraft-Check ausgeben',
]

const FAECHER = ['Biologie', 'Chemie', 'Physik', 'Mathematik', 'Deutsch', 'Geschichte',
  'Geographie', 'Politik', 'Philosophie', 'Englisch', 'Latein', 'Kunst', 'Musik', 'Sport', 'Informatik']
const STUFEN = Array.from({ length: 9 }, (_, i) => `${i + 5}`)
const SCHULFORMEN = ['Gymnasium', 'Realschule', 'Gesamtschule', 'Berufsschule', 'Grundschule']
const BUNDESLAENDER = ['NRW', 'Bayern', 'Berlin', 'Hamburg', 'Hessen', 'Baden-Württemberg',
  'Sachsen', 'Niedersachsen', 'Brandenburg', 'Thüringen', 'Sachsen-Anhalt',
  'Mecklenburg-Vorpommern', 'Rheinland-Pfalz', 'Saarland', 'Schleswig-Holstein', 'Bremen']

interface AnalyseResult {
  spielId: string
  result: {
    lernziel: { schritt_7_lernziel: { original: string }; schritt_9_ampel: { farbe: string; lernziel_mvp_variante: string | null } }
    check: { schritt_21_lehrkraft_check: { gesamtampel: 'gruen' | 'gelb' | 'rot'; lernziel_original: string; lernziel_mvp_variante: string | null; dimensionen: Record<string, unknown>; lernzielanteile: { vollstaendig_abgedeckt: string[]; teilweise_abgedeckt: string[]; nicht_abgedeckt: string[] }; hinweise_fuer_lehrkraft: string[]; spielfunktion: string; begruendung_anpassungen: string | null } }
  }
}

const STEPS_NAV = ['Material', 'Details', 'KI analysiert', 'Ergebnis']

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E9D5FF',
  boxShadow: '0 2px 24px rgba(124,58,237,0.08)',
  borderRadius: 20,
}

const inputStyle = {
  width: '100%',
  border: '1.5px solid #E9D5FF',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  background: '#FAFAFA',
  color: '#1F1235',
  outline: 'none',
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1F1235' }

export default function GameErstellenPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [progressSchrittIndex, setProgressSchrittIndex] = useState(0)
  const [analyseResult, setAnalyseResult] = useState<AnalyseResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const stepIndex = step === 'upload' ? 0 : step === 'metadata' ? 1 : step === 'analysing' ? 2 : step === 'result' ? 3 : 0

  function onFile(f: File) { setFile(f); setStep('metadata') }

  function onSubmitMetadata(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const spielname = (form.elements.namedItem('spielname') as HTMLInputElement).value
    const fach = (form.elements.namedItem('fach') as HTMLSelectElement).value
    const jahrgangsstufe = (form.elements.namedItem('jahrgangsstufe') as HTMLSelectElement).value
    const schulform = (form.elements.namedItem('schulform') as HTMLSelectElement).value
    const bundesland = (form.elements.namedItem('bundesland') as HTMLSelectElement).value
    const lernziel = (form.elements.namedItem('lernziel') as HTMLInputElement).value
    const zeitrahmen = parseInt((form.elements.namedItem('zeitrahmen') as HTMLInputElement).value) || 15

    // Sofort rendern — außerhalb der Transition
    setStep('analysing')
    setErrorMsg(null)
    setProgressPercent(0)
    setProgressLabel('Upload läuft …')
    setProgressSchrittIndex(0)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file!)
        formData.append('fach', fach)
        formData.append('jahrgangsstufe', jahrgangsstufe)
        formData.append('schulform', schulform)
        formData.append('bundesland', bundesland)

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}))
          throw new Error(body.error ?? 'Upload fehlgeschlagen')
        }
        const { material } = await uploadRes.json()

        const analyseRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId: material.id, spielname: spielname || undefined, lernzielLehrkraft: lernziel || undefined, zeitrahmenMinuten: zeitrahmen }),
        })
        if (!analyseRes.ok) {
          const body = await analyseRes.json().catch(() => ({}))
          throw new Error(body.error ?? 'Analyse fehlgeschlagen')
        }

        const reader = analyseRes.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress') {
              setProgressLabel(event.label)
              setProgressPercent(event.percent)
              setProgressSchrittIndex(event.schrittIndex)
            } else if (event.type === 'done') {
              setProgressPercent(100)
              setProgressSchrittIndex(ANALYSE_SCHRITTE.length)
              setAnalyseResult({ spielId: event.spielId, result: event.result })
              setStep('result')
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          }
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler')
        setStep('error')
      }
    })
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1F1235' }}>Game erstellen</h1>
        <p className="text-sm mt-1" style={{ color: '#7A6A94' }}>Material hochladen → KI analysiert → Spiel generieren</p>
      </div>

      {/* Step Progress */}
      {step !== 'error' && (
        <div className="flex items-center gap-0 mb-8">
          {STEPS_NAV.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                  style={{
                    background: i <= stepIndex ? '#7C3AED' : '#E9D5FF',
                    color: i <= stepIndex ? 'white' : '#7A6A94',
                  }}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium whitespace-nowrap"
                  style={{ color: i === stepIndex ? '#7C3AED' : i < stepIndex ? '#1F1235' : '#7A6A94' }}>
                  {s}
                </span>
              </div>
              {i < STEPS_NAV.length - 1 && (
                <div className="flex-1 h-0.5 mx-3" style={{ background: i < stepIndex ? '#7C3AED' : '#E9D5FF' }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div style={cardStyle} className="p-8">
          <h2 className="text-lg font-bold mb-1" style={{ color: '#1F1235' }}>Material hochladen</h2>
          <p className="text-sm mb-6" style={{ color: '#7A6A94' }}>Lade ein PDF oder eine Textdatei mit deinem Unterrichtsmaterial hoch.</p>
          <UploadZone onFile={onFile} />
        </div>
      )}

      {/* Step 2: Metadata */}
      {step === 'metadata' && file && (
        <div style={cardStyle} className="p-8">
          <h2 className="text-lg font-bold mb-1" style={{ color: '#1F1235' }}>Details angeben</h2>
          <p className="text-sm mb-6" style={{ color: '#7A6A94' }}>Damit die KI ein passendes Spiel erstellt, brauchen wir noch ein paar Infos.</p>

          {/* File badge */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
            style={{ background: '#F6F1FF', border: '1px solid #E9D5FF' }}>
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#1F1235' }}>{file.name}</p>
              <p className="text-xs" style={{ color: '#7A6A94' }}>{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={() => setStep('upload')}
              className="text-xs font-medium transition-colors"
              style={{ color: '#7C3AED' }}>Ändern</button>
          </div>

          <form onSubmit={onSubmitMetadata} className="flex flex-col gap-4">
            <div>
              <label style={labelStyle}>Spielname</label>
              <input name="spielname" type="text" required placeholder="z.B. Fotosynthese – Klasse 9a" style={inputStyle} />
              <p className="text-xs mt-1.5" style={{ color: '#7A6A94' }}>So findest du das Spiel später in deiner Übersicht.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Fach</label>
                <select name="fach" required style={inputStyle}>
                  <option value="">Bitte wählen</option>
                  {FAECHER.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Jahrgangsstufe</label>
                <select name="jahrgangsstufe" required style={inputStyle}>
                  <option value="">Bitte wählen</option>
                  {STUFEN.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Schulform</label>
                <select name="schulform" required style={inputStyle}>
                  <option value="">Bitte wählen</option>
                  {SCHULFORMEN.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bundesland</label>
                <select name="bundesland" required style={inputStyle}>
                  <option value="">Bitte wählen</option>
                  {BUNDESLAENDER.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Zeitrahmen (Minuten)</label>
              <input name="zeitrahmen" type="number" defaultValue={15} min={5} max={90} style={{ ...inputStyle, width: 120 }} />
            </div>

            <div>
              <label style={labelStyle}>
                Eigenes Lernziel <span style={{ color: '#7A6A94', fontWeight: 400 }}>(optional)</span>
              </label>
              <input name="lernziel" type="text" placeholder="Die Schüler können… indem sie…" style={inputStyle} />
              <p className="text-xs mt-1.5" style={{ color: '#7A6A94' }}>Ohne Angabe formuliert die KI ein Lernziel aus dem Material.</p>
            </div>

            <button type="submit" disabled={isPending}
              className="w-full rounded-xl py-3 text-sm font-bold transition-all mt-2"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white', boxShadow: '0 4px 20px rgba(124,58,237,0.35)', opacity: isPending ? 0.6 : 1 }}>
              {isPending ? 'Wird gestartet…' : '✦ Spiel generieren →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Analysing */}
      {step === 'analysing' && (
        <div style={cardStyle} className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
              🤖
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold" style={{ color: '#1F1235' }}>KI analysiert dein Material</h2>
              <p className="text-xs" style={{ color: '#7A6A94' }}>{progressLabel || 'Wird vorbereitet …'}</p>
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#7C3AED' }}>
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="rounded-full h-3 mb-6" style={{ background: '#E9D5FF' }}>
            <div className="h-3 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #7C3AED, #A855F7)' }} />
          </div>

          <div className="flex flex-col gap-1">
            {ANALYSE_SCHRITTE.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: i === progressSchrittIndex ? '#F6F1FF' : 'transparent',
                  color: i < progressSchrittIndex ? '#059669' : i === progressSchrittIndex ? '#7C3AED' : '#C4B5FD',
                }}>
                <span className="w-5 text-center flex-shrink-0 text-xs">
                  {i < progressSchrittIndex ? '✓' : i === progressSchrittIndex ? '⟳' : `${i + 1}`}
                </span>
                <span className={i === progressSchrittIndex ? 'font-semibold' : ''}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && analyseResult && (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: '#D1FAE5', border: '1px solid #6EE7B7' }}>
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#065F46' }}>Spiel erfolgreich erstellt!</p>
              <a href={`/modules/${analyseResult.spielId}`}
                className="text-xs font-medium" style={{ color: '#059669' }}>
                → Zum Modul wechseln & freigeben
              </a>
            </div>
          </div>
          <LehrkraftCheckPanel
            spielId={analyseResult.spielId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            check={analyseResult.result.check.schritt_21_lehrkraft_check as any}
          />
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="rounded-2xl p-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: '#991B1B' }}>Fehler beim Erstellen</p>
              <p className="text-sm" style={{ color: '#B91C1C' }}>{errorMsg}</p>
              <button onClick={() => setStep('upload')} className="mt-4 text-sm font-medium"
                style={{ color: '#7C3AED' }}>← Neu versuchen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
