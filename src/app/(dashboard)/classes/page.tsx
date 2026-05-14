'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

const TIER_NAMEN = [
  'ADLER', 'BAER', 'DACHS', 'ELCH', 'FUCHS', 'GEIER', 'HAMSTER', 'IGEL',
  'JAGUAR', 'KOLIBRI', 'LEMUR', 'MARDER', 'NASHORN', 'OTTER', 'PANDA', 'QUOKKA',
  'RABE', 'STORCH', 'TAPIR', 'UHUUU', 'VIELFRAS', 'WASCHBAER', 'YOGI', 'ZEBRA',
]

function generateCode(tiername: string): string {
  const zahl = Math.floor(1000 + Math.random() * 9000)
  return `${tiername}-${zahl}`
}

function generateCodes(anzahl: number): string[] {
  const shuffled = [...TIER_NAMEN].sort(() => Math.random() - 0.5)
  return Array.from({ length: anzahl }, (_, i) => generateCode(shuffled[i % shuffled.length]))
}

interface Klasse { id: string; name: string; jahrgangsstufe: string; fach: string; erstellt_am: string }

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

export default function ClassesPage() {
  const [klassen, setKlassen] = useState<Klasse[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedKlasse, setSelectedKlasse] = useState<string | null>(null)
  const [codes, setCodes] = useState<string[]>([])
  const [anzahl, setAnzahl] = useState(25)

  useEffect(() => {
    createClient().from('classes').select('*').order('erstellt_am', { ascending: false })
      .then(({ data }) => setKlassen(data ?? []))
  }, [])

  function onCreateKlasse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const jahrgangsstufe = (form.elements.namedItem('jahrgangsstufe') as HTMLInputElement).value
    const fach = (form.elements.namedItem('fach') as HTMLInputElement).value

    startTransition(async () => {
      setError(null)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Nicht eingeloggt.'); return }

      const { data, error: dbError } = await supabase
        .from('classes')
        .insert({ name, jahrgangsstufe, fach, lehrer_id: user.id })
        .select()
        .single()

      if (dbError || !data) {
        setError('Klasse konnte nicht angelegt werden.')
        return
      }
      setKlassen((prev) => [data, ...prev])
      setShowForm(false)
    })
  }

  const selectedKlasseData = klassen.find((k) => k.id === selectedKlasse)

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F1235' }}>Klassen & Schüler</h1>
          <p className="text-sm mt-1" style={{ color: '#7A6A94' }}>Klassen anlegen und DSGVO-konforme Schüler-Codes generieren</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null) }}
          className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
          + Klasse anlegen
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={cardStyle} className="p-6 mb-6">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#1F1235' }}>Neue Klasse anlegen</h3>
          <form onSubmit={onCreateKlasse} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label style={labelStyle}>Bezeichnung</label>
                <input name="name" required placeholder="z.B. 9a" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Jahrgangsstufe</label>
                <input name="jahrgangsstufe" required placeholder="z.B. 9" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fach</label>
                <input name="fach" required placeholder="z.B. Biologie" style={inputStyle} />
              </div>
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                {error}
              </div>
            )}
            <div className="flex gap-3 mt-1">
              <button type="submit" disabled={isPending}
                className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white', opacity: isPending ? 0.6 : 1 }}>
                {isPending ? 'Anlegen…' : 'Anlegen'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null) }}
                className="rounded-xl px-5 py-2.5 text-sm font-medium"
                style={{ color: '#7A6A94' }}>
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      {klassen.length === 0 ? (
        <div style={{ border: '2px dashed #E9D5FF', borderRadius: 20 }} className="p-16 text-center">
          <span className="text-4xl mb-3 block">👥</span>
          <p className="text-sm font-medium" style={{ color: '#7A6A94' }}>Noch keine Klassen angelegt</p>
          <p className="text-xs mt-1" style={{ color: '#C4B5FD' }}>Klick auf „+ Klasse anlegen" um loszulegen</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {klassen.map((k) => (
            <div key={k.id}
              onClick={() => { setSelectedKlasse(k.id); setCodes([]) }}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all"
              style={{
                background: selectedKlasse === k.id ? '#F6F1FF' : '#FFFFFF',
                border: selectedKlasse === k.id ? '1.5px solid #7C3AED' : '1px solid #E9D5FF',
                borderRadius: 16,
                boxShadow: selectedKlasse === k.id ? '0 2px 16px rgba(124,58,237,0.12)' : '0 1px 4px rgba(124,58,237,0.04)',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: selectedKlasse === k.id ? 'linear-gradient(135deg, #7C3AED, #A855F7)' : '#F3EEFF', color: selectedKlasse === k.id ? 'white' : '#7C3AED' }}>
                {k.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#1F1235' }}>{k.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>Klasse {k.jahrgangsstufe} · {k.fach}</p>
              </div>
              <span className="text-xs font-medium" style={{ color: selectedKlasse === k.id ? '#7C3AED' : '#C4B5FD' }}>
                {selectedKlasse === k.id ? '● Ausgewählt' : 'Auswählen →'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Code Generator */}
      {selectedKlasse && selectedKlasseData && (
        <div style={cardStyle} className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl">🔑</span>
            <div>
              <h3 className="font-bold text-sm" style={{ color: '#1F1235' }}>Schüler-Codes — {selectedKlasseData.name}</h3>
              <p className="text-xs" style={{ color: '#7A6A94' }}>Kein Klarname, keine E-Mail — DSGVO-konform</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl px-4 py-3 my-5"
            style={{ background: '#F6F1FF', border: '1px solid #E9D5FF' }}>
            <span className="text-sm font-semibold" style={{ color: '#1F1235' }}>Anzahl Schüler:</span>
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid #E9D5FF', background: '#FFFFFF' }}>
              <button onClick={() => setAnzahl((n) => Math.max(1, n - 1))}
                className="px-3 py-2 text-sm font-bold transition-colors hover:bg-purple-50"
                style={{ color: '#7C3AED' }}>−</button>
              <input type="number" value={anzahl} min={1} max={40}
                onChange={(e) => setAnzahl(parseInt(e.target.value) || 1)}
                className="w-14 text-center text-sm py-2 font-bold outline-none"
                style={{ color: '#1F1235', background: 'transparent' }} />
              <button onClick={() => setAnzahl((n) => Math.min(40, n + 1))}
                className="px-3 py-2 text-sm font-bold transition-colors hover:bg-purple-50"
                style={{ color: '#7C3AED' }}>+</button>
            </div>
            <button onClick={() => setCodes(generateCodes(anzahl))}
              className="rounded-xl px-5 py-2 text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white', boxShadow: '0 3px 12px rgba(124,58,237,0.3)' }}>
              Codes generieren
            </button>
          </div>

          {codes.length > 0 && (
            <div>
              <div className="rounded-xl p-4 mb-4" style={{ background: '#FAFAFA', border: '1px solid #E9D5FF' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#7A6A94' }}>
                  {codes.length} Codes für {selectedKlasseData.name} — ausschneiden und verteilen
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {codes.map((code, i) => (
                    <div key={i} className="rounded-lg px-2 py-2.5 text-center font-mono text-xs font-bold"
                      style={{ border: '1.5px dashed #C4B5FD', background: '#FFFFFF', color: '#5B21B6' }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => window.print()}
                className="text-sm font-medium transition-colors"
                style={{ color: '#7C3AED' }}>
                🖨️ Drucken
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
