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
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Klassen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Klassen anlegen und Schüler-Codes generieren</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(null) }}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          + Klasse anlegen
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreateKlasse} className="border rounded-xl p-5 mb-6 flex flex-col gap-3 bg-muted/20">
          <h3 className="font-medium text-sm">Neue Klasse</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Bezeichnung</label>
              <input name="name" required placeholder="z.B. 9a"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Stufe</label>
              <input name="jahrgangsstufe" required placeholder="z.B. 9"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fach</label>
              <input name="fach" required placeholder="z.B. Biologie"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isPending ? 'Anlegen…' : 'Anlegen'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null) }}
              className="text-sm text-muted-foreground hover:text-foreground px-4 py-2">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {klassen.length === 0 ? (
        <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center text-muted-foreground text-sm">
          Noch keine Klassen angelegt.
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {klassen.map((k) => (
            <div key={k.id}
              className={`flex items-center gap-4 border rounded-xl px-5 py-4 cursor-pointer transition-colors
                ${selectedKlasse === k.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
              onClick={() => { setSelectedKlasse(k.id); setCodes([]) }}>
              <div className="flex-1">
                <p className="font-medium text-sm">{k.name}</p>
                <p className="text-xs text-muted-foreground">Klasse {k.jahrgangsstufe} · {k.fach}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {selectedKlasse === k.id ? 'ausgewählt' : 'auswählen →'}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedKlasse && selectedKlasseData && (
        <div className="border rounded-xl p-5">
          <h3 className="font-semibold mb-1">Schüler-Codes — {selectedKlasseData.name}</h3>
          <p className="text-xs text-muted-foreground mb-5">
            Kein Klarname, keine E-Mail — DSGVO-konform. Codes ausdrucken und verteilen.
          </p>

          {/* Anzahl + Generieren */}
          <div className="flex items-center gap-3 mb-5 p-4 bg-muted/30 rounded-xl">
            <span className="text-sm font-medium">Anzahl Schüler:</span>
            <div className="flex items-center gap-1 border rounded-lg overflow-hidden bg-background">
              <button
                onClick={() => setAnzahl((n) => Math.max(1, n - 1))}
                className="px-3 py-2 text-sm font-bold hover:bg-muted transition-colors">−</button>
              <input
                type="number"
                value={anzahl}
                min={1}
                max={40}
                onChange={(e) => setAnzahl(parseInt(e.target.value) || 1)}
                className="w-14 text-center text-sm py-2 outline-none bg-background font-medium"
              />
              <button
                onClick={() => setAnzahl((n) => Math.min(40, n + 1))}
                className="px-3 py-2 text-sm font-bold hover:bg-muted transition-colors">+</button>
            </div>
            <button
              onClick={() => setCodes(generateCodes(anzahl))}
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
              Codes generieren
            </button>
          </div>

          {codes.length > 0 && (
            <div>
              <div className="border rounded-lg p-4 mb-3 bg-white">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  {codes.length} Codes für {selectedKlasseData.name} — ausschneiden und verteilen
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {codes.map((code, i) => (
                    <div key={i} className="border border-dashed rounded-md px-2 py-2 text-center font-mono text-xs">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => window.print()}
                className="text-sm text-primary hover:underline">
                🖨️ Drucken
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
