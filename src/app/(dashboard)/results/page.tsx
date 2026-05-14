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

const AMPEL_COLORS: Record<string, string> = {
  gruen: '#059669', gelb: '#D97706', rot: '#DC2626',
}
const STATUS_LABEL: Record<string, string> = {
  erreicht: 'Lernziel erreicht',
  teilweise_erreicht: 'Teilweise erreicht',
  noch_nicht_gesichert: 'Noch nicht gesichert',
}

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E9D5FF',
  boxShadow: '0 2px 24px rgba(124,58,237,0.08)',
  borderRadius: 20,
}

export default function ResultsPage() {
  const [spiele, setSpiele] = useState<Spiel[]>([])
  const [selectedSpiel, setSelectedSpiel] = useState<string | null>(null)
  const [diagnose, setDiagnose] = useState<DiagnoseData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('games')
        .select('id, titel, status, erstellt_am')
        .eq('lehrer_id', user.id)
        .eq('status', 'freigegeben')
        .order('erstellt_am', { ascending: false })
      setSpiele(data ?? [])
    }
    load()
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1F1235' }}>Auswertungen</h1>
        <p className="text-sm mt-1" style={{ color: '#7A6A94' }}>Lernstandsdiagnose nach Spielende — KI-gestützte Klassenanalyse</p>
      </div>

      {/* Game List */}
      {spiele.length === 0 ? (
        <div style={{ border: '2px dashed #E9D5FF', borderRadius: 20 }} className="p-16 text-center">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-sm font-medium" style={{ color: '#7A6A94' }}>Noch keine freigegebenen Spiele mit Schülerantworten</p>
          <p className="text-xs mt-1" style={{ color: '#C4B5FD' }}>Erstelle zuerst ein Spiel und gib es frei</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {spiele.map((s) => (
            <div key={s.id}
              className="flex items-center gap-4 px-5 py-4 transition-all"
              style={{
                background: selectedSpiel === s.id ? '#F6F1FF' : '#FFFFFF',
                border: selectedSpiel === s.id ? '1.5px solid #7C3AED' : '1px solid #E9D5FF',
                borderRadius: 16,
                boxShadow: '0 1px 4px rgba(124,58,237,0.04)',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: '#F3EEFF' }}>🎮</div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#1F1235' }}>{s.titel}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>{new Date(s.erstellt_am).toLocaleDateString('de-DE')}</p>
              </div>
              <button onClick={() => onDiagnose(s.id)} disabled={isPending}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={{
                  background: isPending && selectedSpiel === s.id ? '#E9D5FF' : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  color: isPending && selectedSpiel === s.id ? '#7A6A94' : 'white',
                  opacity: isPending && selectedSpiel !== s.id ? 0.5 : 1,
                }}>
                {isPending && selectedSpiel === s.id ? 'Analysiert…' : 'Diagnose starten'}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl p-4 mb-5 text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          ⚠️ {error}
        </div>
      )}

      {diagnose && (
        <div className="flex flex-col gap-5">
          {/* Klassenüberblick */}
          <div style={cardStyle} className="p-6">
            <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Klassenüberblick</h2>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="rounded-2xl p-4" style={{ background: '#D1FAE5', border: '1px solid #6EE7B7' }}>
                <p className="text-2xl font-black" style={{ color: '#065F46' }}>{diagnose.klassenueberblick.lernziel_erreicht}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#059669' }}>Lernziel erreicht</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <p className="text-2xl font-black" style={{ color: '#92400E' }}>{diagnose.klassenueberblick.lernziel_teilweise}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#D97706' }}>Teilweise erreicht</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <p className="text-2xl font-black" style={{ color: '#991B1B' }}>{diagnose.klassenueberblick.lernziel_noch_nicht_gesichert}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#DC2626' }}>Noch nicht gesichert</p>
              </div>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: '#F6F1FF', border: '1px solid #E9D5FF' }}>
              <p className="text-sm" style={{ color: '#1F1235' }}>{diagnose.klassenueberblick.gesamteinschaetzung}</p>
            </div>
            {diagnose.klassenueberblick.abdeckungshinweis && (
              <p className="text-xs mt-2 italic" style={{ color: '#7A6A94' }}>{diagnose.klassenueberblick.abdeckungshinweis}</p>
            )}
          </div>

          {/* Kompetenzampel */}
          {diagnose.kompetenzampel_klasse.length > 0 && (
            <div style={cardStyle} className="p-6">
              <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Teilkompetenzen</h2>
              <div className="flex flex-col gap-2">
                {diagnose.kompetenzampel_klasse.map((k, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                    style={{ borderColor: '#F3EEFF' }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: AMPEL_COLORS[k.status] ?? '#C4B5FD' }} />
                    <span className="text-sm flex-1" style={{ color: '#1F1235' }}>{k.teilkompetenz}</span>
                    <span className="text-xs" style={{ color: '#7A6A94' }}>{k.einschaetzung}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fehlvorstellungen */}
          {diagnose.haeufige_fehlvorstellungen.length > 0 && (
            <div style={cardStyle} className="p-6">
              <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Häufige Fehlvorstellungen</h2>
              <div className="flex flex-col gap-3">
                {diagnose.haeufige_fehlvorstellungen.map((f, i) => (
                  <div key={i} className="rounded-xl px-4 py-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold" style={{ color: '#92400E' }}>{f.fehlvorstellung}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                        style={{ background: '#FDE68A', color: '#92400E' }}>{f.haeufigkeit}×</span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: '#D97706' }}>{f.empfehlung}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empfehlungen */}
          {(diagnose.empfehlungen_weiterarbeit.plenum.length > 0 || diagnose.empfehlungen_weiterarbeit.vertiefung.length > 0) && (
            <div style={cardStyle} className="p-6">
              <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Empfehlungen Weiterarbeit</h2>
              {diagnose.empfehlungen_weiterarbeit.plenum.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#7C3AED' }}>Im Plenum</p>
                  <ul className="flex flex-col gap-1.5">
                    {diagnose.empfehlungen_weiterarbeit.plenum.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1F1235' }}>
                        <span style={{ color: '#A855F7' }}>→</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {diagnose.empfehlungen_weiterarbeit.vertiefung.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#7C3AED' }}>Vertiefung</p>
                  <ul className="flex flex-col gap-1.5">
                    {diagnose.empfehlungen_weiterarbeit.vertiefung.map((v, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1F1235' }}>
                        <span style={{ color: '#A855F7' }}>→</span> {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Individuelle Diagnosen */}
          {diagnose.individuelle_diagnosen.length > 0 && (
            <div style={cardStyle} className="p-6">
              <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>
                Individuelle Diagnosen
                <span className="ml-2 text-sm font-normal" style={{ color: '#7A6A94' }}>({diagnose.individuelle_diagnosen.length} Codes)</span>
              </h2>
              <div className="flex flex-col gap-2">
                {diagnose.individuelle_diagnosen.map((d, i) => {
                  const statusColor = d.lernzielstatus === 'erreicht' ? '#059669'
                    : d.lernzielstatus === 'teilweise_erreicht' ? '#D97706' : '#DC2626'
                  return (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b last:border-0"
                      style={{ borderColor: '#F3EEFF' }}>
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: '#F3EEFF', color: '#5B21B6' }}>{d.code}</span>
                      <div className="flex-1">
                        <span className="text-xs font-semibold" style={{ color: statusColor }}>
                          {STATUS_LABEL[d.lernzielstatus] ?? d.lernzielstatus}
                        </span>
                        {d.empfehlung && <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>{d.empfehlung}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
