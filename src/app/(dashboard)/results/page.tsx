'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Spiel { id: string; titel: string; status: string; erstellt_am: string }
interface DiagnoseData {
  klassenueberblick: {
    anzahl_codes: number
    lernziel_erreicht: number
    lernziel_teilweise: number
    lernziel_noch_nicht_gesichert: number
    gesamteinschaetzung: string
    lernziel_original: string
    abdeckungshinweis: string
  }
  kompetenzampel_klasse: { teilkompetenz: string; status: string; einschaetzung: string }[]
  haeufige_fehlvorstellungen: { fehlvorstellung: string; haeufigkeit: number; empfehlung: string }[]
  empfehlungen_weiterarbeit: { plenum: string[]; vertiefung: string[]; erweiterung: string[] }
  individuelle_diagnosen: { code: string; lernzielstatus: string; empfehlung: string }[]
}

const AMPEL: Record<string, string> = {
  gruen: 'bg-green-500', gelb: 'bg-yellow-400', rot: 'bg-red-500',
}
const STATUS_LABEL: Record<string, string> = {
  erreicht: 'Lernziel erreicht',
  teilweise_erreicht: 'Teilweise erreicht',
  noch_nicht_gesichert: 'Noch nicht gesichert',
}
const STATUS_COLOR: Record<string, string> = {
  erreicht: 'text-green-700',
  teilweise_erreicht: 'text-yellow-700',
  noch_nicht_gesichert: 'text-red-700',
}

export default function ResultsPage() {
  const [spiele, setSpiele] = useState<Spiel[]>([])
  const [selectedSpiel, setSelectedSpiel] = useState<string | null>(null)
  const [diagnose, setDiagnose] = useState<DiagnoseData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createClient().from('games').select('id, titel, status, erstellt_am')
      .eq('status', 'freigegeben').order('erstellt_am', { ascending: false })
      .then(({ data }) => setSpiele(data ?? []))
  }, [])

  function onDiagnose(spielId: string) {
    setSelectedSpiel(spielId)
    setDiagnose(null)
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spielId, modus: 'kompakt' }),
      })
      if (!res.ok) { setError('Diagnose fehlgeschlagen'); return }
      const data = await res.json()
      setDiagnose(data.diagnose)
    })
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Auswertungen</h1>
      <p className="text-sm text-muted-foreground mb-6">Lernstandsdiagnose nach Spielende</p>

      {spiele.length === 0 ? (
        <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center text-muted-foreground text-sm">
          Noch keine freigegebenen Module mit Schülerantworten.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mb-8">
          {spiele.map((s) => (
            <div key={s.id} className={`flex items-center gap-4 border rounded-xl px-5 py-4 transition-colors
              ${selectedSpiel === s.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}>
              <div className="flex-1">
                <p className="font-medium text-sm">{s.titel}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.erstellt_am).toLocaleDateString('de-DE')}</p>
              </div>
              <button onClick={() => onDiagnose(s.id)} disabled={isPending}
                className="text-sm text-primary hover:underline disabled:opacity-50">
                {isPending && selectedSpiel === s.id ? 'Lädt…' : 'Diagnose starten'}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">{error}</div>
      )}

      {diagnose && (
        <div className="flex flex-col gap-5">
          {/* Überblick */}
          <div className="border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Klassenüberblick</h2>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-700">{diagnose.klassenueberblick.lernziel_erreicht}</p>
                <p className="text-xs text-green-600 mt-1">Lernziel erreicht</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-yellow-700">{diagnose.klassenueberblick.lernziel_teilweise}</p>
                <p className="text-xs text-yellow-600 mt-1">Teilweise erreicht</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-700">{diagnose.klassenueberblick.lernziel_noch_nicht_gesichert}</p>
                <p className="text-xs text-red-600 mt-1">Noch nicht gesichert</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
              {diagnose.klassenueberblick.gesamteinschaetzung}
            </p>
            {diagnose.klassenueberblick.abdeckungshinweis && (
              <p className="text-xs text-muted-foreground mt-2 italic">{diagnose.klassenueberblick.abdeckungshinweis}</p>
            )}
          </div>

          {/* Kompetenzampel */}
          {diagnose.kompetenzampel_klasse.length > 0 && (
            <div className="border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Teilkompetenzen</h2>
              <div className="flex flex-col gap-2">
                {diagnose.kompetenzampel_klasse.map((k, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-muted/50 last:border-0">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${AMPEL[k.status] ?? 'bg-muted'}`} />
                    <span className="text-sm flex-1">{k.teilkompetenz}</span>
                    <span className="text-xs text-muted-foreground">{k.einschaetzung}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Häufige Fehlvorstellungen */}
          {diagnose.haeufige_fehlvorstellungen.length > 0 && (
            <div className="border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Häufige Fehlvorstellungen</h2>
              <div className="flex flex-col gap-3">
                {diagnose.haeufige_fehlvorstellungen.map((f, i) => (
                  <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium text-yellow-900">{f.fehlvorstellung}</p>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded flex-shrink-0">{f.haeufigkeit}×</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">{f.empfehlung}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empfehlungen */}
          {(diagnose.empfehlungen_weiterarbeit.plenum.length > 0 ||
            diagnose.empfehlungen_weiterarbeit.vertiefung.length > 0) && (
            <div className="border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Empfehlungen Weiterarbeit</h2>
              {diagnose.empfehlungen_weiterarbeit.plenum.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Im Plenum</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {diagnose.empfehlungen_weiterarbeit.plenum.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {diagnose.empfehlungen_weiterarbeit.vertiefung.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Vertiefung</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {diagnose.empfehlungen_weiterarbeit.vertiefung.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Individuelle Diagnosen */}
          {diagnose.individuelle_diagnosen.length > 0 && (
            <div className="border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Individuelle Diagnosen ({diagnose.individuelle_diagnosen.length} Codes)</h2>
              <div className="flex flex-col gap-2">
                {diagnose.individuelle_diagnosen.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-muted/50 last:border-0">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded flex-shrink-0">{d.code}</span>
                    <div className="flex-1">
                      <span className={`text-xs font-medium ${STATUS_COLOR[d.lernzielstatus] ?? ''}`}>
                        {STATUS_LABEL[d.lernzielstatus] ?? d.lernzielstatus}
                      </span>
                      {d.empfehlung && <p className="text-xs text-muted-foreground mt-0.5">{d.empfehlung}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
