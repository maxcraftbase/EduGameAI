'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Ampel = 'gruen' | 'gelb' | 'rot'
type DimStatus = 'ok' | 'warnung' | 'problem'

interface Dimensionen {
  fachliche_korrektheit: DimStatus
  lernzielpassung: DimStatus
  spielbarkeit_ampel: Ampel
  mvp_tauglichkeit: DimStatus
  game_engine_passung: DimStatus
  regelbasiert_auswertbar: boolean
  ki_call_pro_antwort_vermieden: boolean
  differenzierung: DimStatus
  feedbackqualitaet: DimStatus
  reduktion_markiert: DimStatus
  altersangemessen: DimStatus
  sourcemapping_vollstaendig: DimStatus
}

interface LehrkraftCheckData {
  gesamtampel: Ampel
  lernziel_original: string
  lernziel_mvp_variante: string | null
  dimensionen: Dimensionen
  lernzielanteile: {
    vollstaendig_abgedeckt: string[]
    teilweise_abgedeckt: string[]
    nicht_abgedeckt: string[]
  }
  hinweise_fuer_lehrkraft: string[]
  spielfunktion: string
  begruendung_anpassungen: string | null
}

interface Props {
  spielId: string
}

const AMPEL_FARBE: Record<Ampel, string> = {
  gruen: 'bg-green-100 text-green-800 border-green-200',
  gelb: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  rot: 'bg-red-100 text-red-800 border-red-200',
}
const AMPEL_DOT: Record<Ampel, string> = {
  gruen: 'bg-green-500',
  gelb: 'bg-yellow-400',
  rot: 'bg-red-500',
}
const DIM_FARBE: Record<DimStatus, string> = {
  ok: 'text-green-700',
  warnung: 'text-yellow-700',
  problem: 'text-red-700',
}
const DIM_ICON: Record<DimStatus, string> = { ok: '✅', warnung: '⚠️', problem: '❌' }
const BOOL_ICON = (v: boolean) => v ? '✅' : '❌'

const DIM_LABELS: Record<keyof Dimensionen, string> = {
  fachliche_korrektheit: 'Fachliche Korrektheit',
  lernzielpassung: 'Lernzielpassung',
  spielbarkeit_ampel: 'Spielbarkeit (Ampel)',
  mvp_tauglichkeit: 'MVP-Tauglichkeit',
  game_engine_passung: 'Game-Engine-Passung',
  regelbasiert_auswertbar: 'Regelbasiert auswertbar',
  ki_call_pro_antwort_vermieden: 'Kein KI-Call pro Antwort',
  differenzierung: 'Differenzierung',
  feedbackqualitaet: 'Feedbackqualität',
  reduktion_markiert: 'Reduktion markiert',
  altersangemessen: 'Altersangemessen',
  sourcemapping_vollstaendig: 'Sourcemapping vollständig',
}

const SPIELFUNKTION_LABEL: Record<string, string> = {
  vorbereitung: 'Vorbereitung',
  uebung: 'Übung',
  sicherung: 'Sicherung',
  diagnose: 'Diagnose',
  teilueberpruefung: 'Teilüberprüfung',
}

export function LehrkraftCheckPanel({ spielId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [check, setCheck] = useState<LehrkraftCheckData | null>(null)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!polling) return
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/games/${spielId}/check`)
        if (cancelled) return
        if (res.status === 202) {
          setTimeout(poll, 4000)
          return
        }
        const body = await res.json()
        if (!body.pending && body.check) {
          setCheck(body.check)
          setPolling(false)
        } else {
          setTimeout(poll, 4000)
        }
      } catch {
        if (!cancelled) setTimeout(poll, 6000)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [spielId, polling])

  function signoff() {
    startTransition(async () => {
      const res = await fetch(`/api/games/${spielId}/signoff`, { method: 'POST' })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    })
  }

  if (!check) {
    return (
      <div className="border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b bg-gray-50 text-gray-600">
          <span className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300 animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Lehrkraft-Check</p>
            <p className="text-xs opacity-70">Qualitätsprüfung läuft im Hintergrund …</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground">
            Die KI prüft gerade die didaktische Qualität des Spiels. Das dauert noch einen Moment.
          </p>
          <p className="text-xs text-muted-foreground mt-1">Seite wird automatisch aktualisiert.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-3 p-4 border-b ${AMPEL_FARBE[check.gesamtampel]}`}>
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${AMPEL_DOT[check.gesamtampel]}`} />
        <div className="flex-1">
          <p className="font-semibold text-sm">Lehrkraft-Check</p>
          <p className="text-xs opacity-80">
            Spielfunktion: {SPIELFUNKTION_LABEL[check.spielfunktion] ?? check.spielfunktion}
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Lernziel */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Lernziel</h3>
          <p className="text-sm bg-muted/40 rounded-lg p-3">{check.lernziel_original}</p>
          {check.lernziel_mvp_variante && (
            <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <span className="font-medium text-yellow-800">MVP-Variante: </span>
              <span className="text-yellow-900">{check.lernziel_mvp_variante}</span>
              {check.begruendung_anpassungen && (
                <p className="text-xs text-yellow-700 mt-1">{check.begruendung_anpassungen}</p>
              )}
            </div>
          )}
        </section>

        {/* 13 Dimensionen */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Dimensionen</h3>
          <div className="grid grid-cols-1 gap-1">
            {(Object.keys(DIM_LABELS) as (keyof Dimensionen)[]).map((key) => {
              const val = check.dimensionen[key]
              const isAmpel = key === 'spielbarkeit_ampel'
              const isBool = typeof val === 'boolean'
              return (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-muted/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{DIM_LABELS[key]}</span>
                  <span className={`text-sm font-medium ${isBool ? '' : isAmpel ? '' : DIM_FARBE[val as DimStatus]}`}>
                    {isBool
                      ? BOOL_ICON(val as boolean)
                      : isAmpel
                      ? <span className="inline-flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${AMPEL_DOT[val as Ampel]}`} />
                          {val}
                        </span>
                      : `${DIM_ICON[val as DimStatus]} ${val}`}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Lernzielanteile */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Lernzielanteile</h3>
          <div className="flex flex-col gap-1.5">
            {check.lernzielanteile.vollstaendig_abgedeckt.length > 0 && (
              <div>
                <span className="text-xs font-medium text-green-700">Vollständig ✅</span>
                <ul className="mt-1 text-sm text-green-900 list-disc list-inside">
                  {check.lernzielanteile.vollstaendig_abgedeckt.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            {check.lernzielanteile.teilweise_abgedeckt.length > 0 && (
              <div>
                <span className="text-xs font-medium text-yellow-700">Teilweise ⚠️</span>
                <ul className="mt-1 text-sm text-yellow-900 list-disc list-inside">
                  {check.lernzielanteile.teilweise_abgedeckt.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            {check.lernzielanteile.nicht_abgedeckt.length > 0 && (
              <div>
                <span className="text-xs font-medium text-red-700">Nicht abgedeckt ❌</span>
                <ul className="mt-1 text-sm text-red-900 list-disc list-inside">
                  {check.lernzielanteile.nicht_abgedeckt.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Hinweise */}
        {check.hinweise_fuer_lehrkraft.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Hinweise</h3>
            <ul className="flex flex-col gap-1">
              {check.hinweise_fuer_lehrkraft.map((h, i) => (
                <li key={i} className="text-sm bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-blue-900">
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Signoff */}
        <div className="pt-2 border-t">
          {done ? (
            <div className="text-sm text-green-700 font-medium bg-green-50 rounded-lg px-4 py-3">
              ✅ Spiel freigegeben — Schüler können jetzt spielen.
            </div>
          ) : (
            <button
              onClick={signoff}
              disabled={isPending}
              className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Freigeben…' : 'Spiel freigeben'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
