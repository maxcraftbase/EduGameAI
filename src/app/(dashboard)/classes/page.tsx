'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Tier-Namen für Code-Generierung ──────────────────────────────────────────
const TIER_NAMEN = [
  'ADLER', 'BAER', 'DACHS', 'ELCH', 'FUCHS', 'GEIER', 'HAMSTER', 'IGEL',
  'JAGUAR', 'KOLIBRI', 'LEMUR', 'MARDER', 'NASHORN', 'OTTER', 'PANDA', 'QUOKKA',
  'RABE', 'STORCH', 'TAPIR', 'UHUUU', 'VIELFRAS', 'WASCHBAER', 'YOGI', 'ZEBRA',
]
function makeCodes(anzahl: number): string[] {
  const shuffled = [...TIER_NAMEN].sort(() => Math.random() - 0.5)
  return Array.from({ length: anzahl }, (_, i) => {
    const zahl = Math.floor(1000 + Math.random() * 9000)
    return `${shuffled[i % shuffled.length]}-${zahl}`
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Klasse { id: string; name: string; jahrgangsstufe: string; fach: string }
interface Student { id: string; code: string }
interface GameInfo { id: string; titel: string; status: string }
interface ClassGame {
  id: string
  game_id: string
  zugewiesen_am: string
  games: GameInfo | GameInfo[] | null
}
function gameTitle(cg: ClassGame): string {
  if (!cg.games) return 'Unbenanntes Spiel'
  return Array.isArray(cg.games) ? (cg.games[0]?.titel ?? 'Unbenanntes Spiel') : cg.games.titel
}
interface AvailableGame { id: string; titel: string; status: string }

type Tab = 'codes' | 'spiele' | 'auswertung'

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E9D5FF',
  boxShadow: '0 2px 24px rgba(124,58,237,0.08)',
  borderRadius: 20,
}
const inputStyle = {
  width: '100%', border: '1.5px solid #E9D5FF', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, background: '#FAFAFA',
  color: '#1F1235', outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1F1235' } as const
const btnPrimary = {
  background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
  color: 'white', borderRadius: 12, padding: '10px 20px',
  fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
} as const

// ── Ampel-Farben ──────────────────────────────────────────────────────────────
const AMPEL_COLOR: Record<string, string> = {
  gruen: '#059669', gelb: '#D97706', rot: '#DC2626',
}
const STATUS_LABEL: Record<string, string> = {
  erreicht: 'Lernziel erreicht', teilweise_erreicht: 'Teilweise erreicht',
  noch_nicht_gesichert: 'Noch nicht gesichert',
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ClassesPage() {
  const [klassen, setKlassen] = useState<Klasse[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('codes')

  // Tab: Codes
  const [students, setStudents] = useState<Student[]>([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [generateAnzahl, setGenerateAnzahl] = useState(25)
  const [generatingCodes, setGeneratingCodes] = useState(false)

  // Tab: Spiele
  const [classGames, setClassGames] = useState<ClassGame[]>([])
  const [gamesLoading, setGamesLoading] = useState(false)
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Tab: Auswertung
  const [diagnose, setDiagnose] = useState<Record<string, unknown> | null>(null)
  const [diagnoseLoading, setDiagnoseLoading] = useState(false)
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  const selected = klassen.find((k) => k.id === selectedId) ?? null

  // ── Klassen laden ────────────────────────────────────────────────────────
  useEffect(() => {
    createClient().from('classes').select('*').order('erstellt_am', { ascending: false })
      .then(({ data }) => setKlassen(data ?? []))
  }, [])

  // ── Codes laden ──────────────────────────────────────────────────────────
  const loadStudents = useCallback(async (classId: string) => {
    setCodesLoading(true)
    const { data } = await createClient().from('students').select('id, code').eq('class_id', classId).order('erstellt_am')
    setStudents(data ?? [])
    setCodesLoading(false)
  }, [])

  // ── Spiele laden ─────────────────────────────────────────────────────────
  const loadClassGames = useCallback(async (classId: string) => {
    setGamesLoading(true)
    const { data } = await createClient()
      .from('class_games')
      .select('id, game_id, zugewiesen_am, games(id, titel, status)')
      .eq('class_id', classId)
      .order('zugewiesen_am', { ascending: false })
    setClassGames((data ?? []) as unknown as ClassGame[])
    setGamesLoading(false)
  }, [])

  // ── Verfügbare Spiele für Zuweisung ──────────────────────────────────────
  const loadAvailableGames = useCallback(async (classId: string) => {
    const { data: all } = await createClient().from('games').select('id, titel, status').order('erstellt_am', { ascending: false })
    const { data: assigned } = await createClient().from('class_games').select('game_id').eq('class_id', classId)
    const assignedIds = new Set((assigned ?? []).map((r) => r.game_id))
    setAvailableGames((all ?? []).filter((g) => !assignedIds.has(g.id)))
  }, [])

  // ── Bei Tab- oder Klassen-Wechsel Daten laden ────────────────────────────
  useEffect(() => {
    if (!selectedId) return
    setDiagnose(null)
    setDiagnoseError(null)
    setSelectedGameId(null)
    if (activeTab === 'codes') loadStudents(selectedId)
    if (activeTab === 'spiele') { loadClassGames(selectedId); loadAvailableGames(selectedId) }
  }, [selectedId, activeTab, loadStudents, loadClassGames, loadAvailableGames])

  // ── Klasse anlegen ────────────────────────────────────────────────────────
  function onCreateKlasse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const jahrgangsstufe = (form.elements.namedItem('jahrgangsstufe') as HTMLInputElement).value
    const fach = (form.elements.namedItem('fach') as HTMLInputElement).value
    startTransition(async () => {
      setFormError(null)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setFormError('Nicht eingeloggt.'); return }
      const { data, error } = await supabase.from('classes')
        .insert({ name, jahrgangsstufe, fach, lehrer_id: user.id }).select().single()
      if (error || !data) { setFormError('Klasse konnte nicht angelegt werden.'); return }
      setKlassen((prev) => [data, ...prev])
      setShowForm(false)
    })
  }

  // ── Klasse bearbeiten ─────────────────────────────────────────────────────
  function onEditKlasse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const jahrgangsstufe = (form.elements.namedItem('jahrgangsstufe') as HTMLInputElement).value
    const fach = (form.elements.namedItem('fach') as HTMLInputElement).value
    startTransition(async () => {
      setFormError(null)
      const { data, error } = await createClient().from('classes')
        .update({ name, jahrgangsstufe, fach }).eq('id', selectedId).select().single()
      if (error || !data) { setFormError('Bearbeitung fehlgeschlagen.'); return }
      setKlassen((prev) => prev.map((k) => k.id === selectedId ? data : k))
      setEditMode(false)
    })
  }

  // ── Codes einmalig generieren + speichern ────────────────────────────────
  async function onGenerateCodes() {
    if (!selectedId) return
    setGeneratingCodes(true)
    const codes = makeCodes(generateAnzahl)
    const rows = codes.map((code) => ({ class_id: selectedId, code }))
    await createClient().from('students').insert(rows)
    await loadStudents(selectedId)
    setGeneratingCodes(false)
  }

  // ── Codes löschen ─────────────────────────────────────────────────────────
  async function onDeleteCodes() {
    if (!selectedId || !confirm('Alle Codes dieser Klasse löschen?')) return
    await createClient().from('students').delete().eq('class_id', selectedId)
    setStudents([])
  }

  // ── Spiel zuweisen ────────────────────────────────────────────────────────
  async function onAssignGame(gameId: string) {
    if (!selectedId) return
    setAssigning(true)
    await createClient().from('class_games').insert({ class_id: selectedId, game_id: gameId })
    await loadClassGames(selectedId)
    await loadAvailableGames(selectedId)
    setAssigning(false)
    setShowAssign(false)
  }

  // ── Spiel-Zuweisung entfernen ─────────────────────────────────────────────
  async function onRemoveGame(classGameId: string) {
    if (!confirm('Zuweisung entfernen?')) return
    await createClient().from('class_games').delete().eq('id', classGameId)
    setClassGames((prev) => prev.filter((cg) => cg.id !== classGameId))
  }

  // ── Diagnose laden ────────────────────────────────────────────────────────
  async function onDiagnose(gameId: string) {
    setSelectedGameId(gameId)
    setDiagnose(null)
    setDiagnoseError(null)
    setDiagnoseLoading(true)
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spielId: gameId, klasseId: selectedId, modus: 'kompakt' }),
    })
    if (!res.ok) { setDiagnoseError('Diagnose fehlgeschlagen'); setDiagnoseLoading(false); return }
    const d = await res.json()
    setDiagnose(d.diagnose)
    setDiagnoseLoading(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F1235' }}>Klassen & Schüler</h1>
          <p className="text-sm mt-1" style={{ color: '#7A6A94' }}>Klassen verwalten · Codes generieren · Spiele zuweisen · Auswertung</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setFormError(null) }} style={btnPrimary}>
          + Klasse anlegen
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={cardStyle} className="p-6 mb-6">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#1F1235' }}>Neue Klasse</h3>
          <form onSubmit={onCreateKlasse} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div><label style={labelStyle}>Bezeichnung</label><input name="name" required placeholder="z.B. 9a" style={inputStyle} /></div>
              <div><label style={labelStyle}>Jahrgangsstufe</label><input name="jahrgangsstufe" required placeholder="z.B. 9" style={inputStyle} /></div>
              <div><label style={labelStyle}>Fach</label><input name="fach" required placeholder="z.B. Biologie" style={inputStyle} /></div>
            </div>
            {formError && <p className="text-sm rounded-xl px-4 py-3" style={{ background: '#FEF2F2', color: '#DC2626' }}>{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={isPending} style={{ ...btnPrimary, opacity: isPending ? 0.6 : 1 }}>
                {isPending ? 'Anlegen…' : 'Anlegen'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ color: '#7A6A94', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-6">
        {/* ── Klassenliste (links) ── */}
        <div className="w-64 flex-shrink-0">
          {klassen.length === 0 ? (
            <div style={{ border: '2px dashed #E9D5FF', borderRadius: 16 }} className="p-8 text-center">
              <span className="text-3xl block mb-2">👥</span>
              <p className="text-xs" style={{ color: '#7A6A94' }}>Noch keine Klassen</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {klassen.map((k) => {
                const active = selectedId === k.id
                return (
                  <button key={k.id}
                    onClick={() => { setSelectedId(k.id); setActiveTab('codes'); setEditMode(false) }}
                    className="text-left px-4 py-3 transition-all w-full"
                    style={{
                      background: active ? '#F6F1FF' : '#FFFFFF',
                      border: active ? '1.5px solid #7C3AED' : '1px solid #E9D5FF',
                      borderRadius: 14,
                      boxShadow: active ? '0 2px 12px rgba(124,58,237,0.12)' : 'none',
                    }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ background: active ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : '#F3EEFF', color: active ? 'white' : '#7C3AED' }}>
                        {k.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#1F1235' }}>{k.name}</p>
                        <p className="text-xs truncate" style={{ color: '#7A6A94' }}>Kl. {k.jahrgangsstufe} · {k.fach}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Detail-Bereich (rechts) ── */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center rounded-2xl" style={{ border: '2px dashed #E9D5FF', minHeight: 320 }}>
            <p className="text-sm" style={{ color: '#C4B5FD' }}>← Klasse auswählen</p>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            {/* Klassen-Header */}
            {editMode ? (
              <div style={cardStyle} className="p-5 mb-4">
                <form onSubmit={onEditKlasse} className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div><label style={{ ...labelStyle, fontSize: 12 }}>Bezeichnung</label><input name="name" required defaultValue={selected.name} style={inputStyle} /></div>
                    <div><label style={{ ...labelStyle, fontSize: 12 }}>Stufe</label><input name="jahrgangsstufe" required defaultValue={selected.jahrgangsstufe} style={inputStyle} /></div>
                    <div><label style={{ ...labelStyle, fontSize: 12 }}>Fach</label><input name="fach" required defaultValue={selected.fach} style={inputStyle} /></div>
                  </div>
                  {formError && <p className="text-sm" style={{ color: '#DC2626' }}>{formError}</p>}
                  <div className="flex gap-3">
                    <button type="submit" disabled={isPending} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>Speichern</button>
                    <button type="button" onClick={() => setEditMode(false)} style={{ color: '#7A6A94', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>Abbrechen</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#1F1235' }}>{selected.name}</h2>
                  <p className="text-sm" style={{ color: '#7A6A94' }}>Klasse {selected.jahrgangsstufe} · {selected.fach}</p>
                </div>
                <button onClick={() => setEditMode(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: '#F3EEFF', color: '#7C3AED', border: '1px solid #E9D5FF' }}>
                  ✏️ Bearbeiten
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: '#F3EEFF' }}>
              {([
                { key: 'codes', label: '🔑 Schüler-Codes' },
                { key: 'spiele', label: '🎮 Spiele' },
                { key: 'auswertung', label: '📊 Auswertung' },
              ] as { key: Tab; label: string }[]).map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                  style={{
                    background: activeTab === t.key ? '#FFFFFF' : 'transparent',
                    color: activeTab === t.key ? '#7C3AED' : '#7A6A94',
                    boxShadow: activeTab === t.key ? '0 1px 8px rgba(124,58,237,0.12)' : 'none',
                    border: 'none', cursor: 'pointer',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Codes ── */}
            {activeTab === 'codes' && (
              <div style={cardStyle} className="p-6">
                {codesLoading ? (
                  <div className="text-sm text-center py-8" style={{ color: '#C4B5FD' }}>Lädt…</div>
                ) : students.length === 0 ? (
                  /* Noch keine Codes */
                  <div>
                    <div className="text-center py-6 mb-6" style={{ border: '2px dashed #E9D5FF', borderRadius: 14 }}>
                      <span className="text-3xl block mb-2">🔑</span>
                      <p className="text-sm font-medium mb-1" style={{ color: '#1F1235' }}>Noch keine Codes generiert</p>
                      <p className="text-xs" style={{ color: '#7A6A94' }}>Codes werden in der Datenbank gespeichert und bleiben dauerhaft erhalten.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold" style={{ color: '#1F1235' }}>Anzahl Schüler:</span>
                      <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid #E9D5FF' }}>
                        <button onClick={() => setGenerateAnzahl((n) => Math.max(1, n - 1))}
                          style={{ padding: '8px 12px', color: '#7C3AED', background: '#FAFAFA', border: 'none', cursor: 'pointer', fontWeight: 700 }}>−</button>
                        <span style={{ padding: '8px 16px', fontWeight: 700, color: '#1F1235', fontSize: 14 }}>{generateAnzahl}</span>
                        <button onClick={() => setGenerateAnzahl((n) => Math.min(40, n + 1))}
                          style={{ padding: '8px 12px', color: '#7C3AED', background: '#FAFAFA', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+</button>
                      </div>
                      <button onClick={onGenerateCodes} disabled={generatingCodes} style={{ ...btnPrimary, opacity: generatingCodes ? 0.6 : 1 }}>
                        {generatingCodes ? 'Generiere…' : 'Codes generieren'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Codes vorhanden */
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#1F1235' }}>{students.length} Schüler-Codes</p>
                        <p className="text-xs" style={{ color: '#7A6A94' }}>Dauerhaft gespeichert · jederzeit druckbar</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.print()}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                          style={{ background: '#F3EEFF', color: '#7C3AED', border: '1px solid #E9D5FF' }}>
                          🖨️ Drucken
                        </button>
                        <button onClick={onDeleteCodes}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                          Löschen
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {students.map((s) => (
                        <div key={s.id} className="rounded-lg py-2.5 text-center font-mono text-xs font-bold"
                          style={{ border: '1.5px dashed #C4B5FD', background: '#FAFAFA', color: '#5B21B6' }}>
                          {s.code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Spiele ── */}
            {activeTab === 'spiele' && (
              <div style={cardStyle} className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#1F1235' }}>Zugewiesene Spiele</p>
                    <p className="text-xs" style={{ color: '#7A6A94' }}>Schüler spielen nur Spiele die dieser Klasse zugewiesen sind</p>
                  </div>
                  <button onClick={() => setShowAssign(!showAssign)}
                    style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>
                    + Spiel zuweisen
                  </button>
                </div>

                {/* Spiel-Auswahl Dropdown */}
                {showAssign && (
                  <div className="mb-5 rounded-xl p-4" style={{ background: '#F6F1FF', border: '1px solid #E9D5FF' }}>
                    <p className="text-xs font-bold mb-3" style={{ color: '#7C3AED' }}>SPIEL AUSWÄHLEN</p>
                    {availableGames.length === 0 ? (
                      <p className="text-sm" style={{ color: '#7A6A94' }}>Alle freigegebenen Spiele sind bereits zugewiesen.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {availableGames.map((g) => (
                          <button key={g.id} onClick={() => onAssignGame(g.id)} disabled={assigning}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full"
                            style={{ background: '#FFFFFF', border: '1px solid #E9D5FF', cursor: 'pointer', opacity: assigning ? 0.6 : 1 }}>
                            <span className="text-lg">🎮</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: '#1F1235' }}>{g.titel || 'Unbenanntes Spiel'}</p>
                              <p className="text-xs" style={{ color: '#7A6A94' }}>{g.status}</p>
                            </div>
                            <span className="text-xs font-bold" style={{ color: '#7C3AED' }}>Zuweisen →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Zugewiesene Spiele Liste */}
                {gamesLoading ? (
                  <div className="text-sm text-center py-8" style={{ color: '#C4B5FD' }}>Lädt…</div>
                ) : classGames.length === 0 ? (
                  <div className="text-center py-10" style={{ border: '2px dashed #E9D5FF', borderRadius: 14 }}>
                    <span className="text-3xl block mb-2">🎮</span>
                    <p className="text-sm" style={{ color: '#7A6A94' }}>Noch keine Spiele zugewiesen</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {classGames.map((cg) => (
                      <div key={cg.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: '#FAFAFA', border: '1px solid #F3EEFF' }}>
                        <span className="text-lg">🎮</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1F1235' }}>
                            {gameTitle(cg)}
                          </p>
                          <p className="text-xs" style={{ color: '#7A6A94' }}>
                            Zugewiesen {new Date(cg.zugewiesen_am).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <button onClick={() => onRemoveGame(cg.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer' }}>
                          Entfernen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Auswertung ── */}
            {activeTab === 'auswertung' && (
              <div style={cardStyle} className="p-6">
                <p className="font-bold text-sm mb-1" style={{ color: '#1F1235' }}>Lernstand analysieren</p>
                <p className="text-xs mb-5" style={{ color: '#7A6A94' }}>Wähle ein Spiel um die Diagnose für diese Klasse zu starten</p>

                {classGames.length === 0 ? (
                  <div className="text-center py-10" style={{ border: '2px dashed #E9D5FF', borderRadius: 14 }}>
                    <span className="text-3xl block mb-2">📊</span>
                    <p className="text-sm" style={{ color: '#7A6A94' }}>Noch keine Spiele zugewiesen</p>
                    <button onClick={() => setActiveTab('spiele')}
                      className="text-xs font-semibold mt-3 px-4 py-2 rounded-xl inline-block"
                      style={{ background: '#F3EEFF', color: '#7C3AED', border: 'none', cursor: 'pointer' }}>
                      → Spiel zuweisen
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-6">
                    {classGames.map((cg) => (
                      <div key={cg.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: selectedGameId === cg.game_id ? '#F6F1FF' : '#FAFAFA',
                          border: selectedGameId === cg.game_id ? '1.5px solid #7C3AED' : '1px solid #F3EEFF',
                        }}>
                        <span className="text-lg">🎮</span>
                        <p className="text-sm font-semibold flex-1 truncate" style={{ color: '#1F1235' }}>
                          {gameTitle(cg)}
                        </p>
                        <button onClick={() => onDiagnose(cg.game_id)} disabled={diagnoseLoading}
                          style={{ ...btnPrimary, padding: '7px 14px', fontSize: 12, opacity: diagnoseLoading && selectedGameId === cg.game_id ? 0.6 : 1 }}>
                          {diagnoseLoading && selectedGameId === cg.game_id ? 'Analysiert…' : 'Diagnose starten'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {diagnoseError && (
                  <div className="rounded-xl p-4 text-sm mb-4" style={{ background: '#FEF2F2', color: '#DC2626' }}>⚠️ {diagnoseError}</div>
                )}

                {diagnose && (() => {
                  const d = diagnose as {
                    klassenueberblick?: { lernziel_erreicht: number; lernziel_teilweise: number; lernziel_noch_nicht_gesichert: number; gesamteinschaetzung: string }
                    kompetenzampel_klasse?: { teilkompetenz: string; status: string; einschaetzung: string }[]
                    haeufige_fehlvorstellungen?: { fehlvorstellung: string; haeufigkeit: number; empfehlung: string }[]
                    individuelle_diagnosen?: { code: string; lernzielstatus: string; empfehlung: string }[]
                  }
                  return (
                    <div className="flex flex-col gap-4">
                      {/* Überblick */}
                      {d.klassenueberblick && (
                        <div className="rounded-2xl p-5" style={{ background: '#F6F1FF', border: '1px solid #E9D5FF' }}>
                          <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#7C3AED' }}>Klassenüberblick</p>
                          <div className="grid grid-cols-3 gap-3 text-center mb-3">
                            <div className="rounded-xl p-3" style={{ background: '#D1FAE5' }}>
                              <p className="text-xl font-black" style={{ color: '#065F46' }}>{d.klassenueberblick.lernziel_erreicht}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#059669' }}>Erreicht</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ background: '#FEF3C7' }}>
                              <p className="text-xl font-black" style={{ color: '#92400E' }}>{d.klassenueberblick.lernziel_teilweise}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#D97706' }}>Teilweise</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ background: '#FEE2E2' }}>
                              <p className="text-xl font-black" style={{ color: '#991B1B' }}>{d.klassenueberblick.lernziel_noch_nicht_gesichert}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#DC2626' }}>Nicht gesichert</p>
                            </div>
                          </div>
                          <p className="text-sm" style={{ color: '#1F1235' }}>{d.klassenueberblick.gesamteinschaetzung}</p>
                        </div>
                      )}

                      {/* Kompetenzen */}
                      {d.kompetenzampel_klasse && d.kompetenzampel_klasse.length > 0 && (
                        <div className="rounded-2xl p-5" style={{ background: '#F6F1FF', border: '1px solid #E9D5FF' }}>
                          <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#7C3AED' }}>Teilkompetenzen</p>
                          {d.kompetenzampel_klasse.map((k, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: '#E9D5FF' }}>
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: AMPEL_COLOR[k.status] ?? '#C4B5FD' }} />
                              <span className="text-sm flex-1" style={{ color: '#1F1235' }}>{k.teilkompetenz}</span>
                              <span className="text-xs" style={{ color: '#7A6A94' }}>{k.einschaetzung}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fehlvorstellungen */}
                      {d.haeufige_fehlvorstellungen && d.haeufige_fehlvorstellungen.length > 0 && (
                        <div className="rounded-2xl p-5" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                          <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#D97706' }}>Häufige Fehlvorstellungen</p>
                          {d.haeufige_fehlvorstellungen.map((f, i) => (
                            <div key={i} className="py-2 border-b last:border-0" style={{ borderColor: '#FDE68A' }}>
                              <div className="flex justify-between gap-2">
                                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>{f.fehlvorstellung}</p>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: '#FDE68A', color: '#92400E' }}>{f.haeufigkeit}×</span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: '#D97706' }}>{f.empfehlung}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Individuelle Diagnosen */}
                      {d.individuelle_diagnosen && d.individuelle_diagnosen.length > 0 && (
                        <div className="rounded-2xl p-5" style={{ background: '#F6F1FF', border: '1px solid #E9D5FF' }}>
                          <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#7C3AED' }}>
                            Individuelle Diagnosen ({d.individuelle_diagnosen.length})
                          </p>
                          {d.individuelle_diagnosen.map((ind, i) => {
                            const statusColor = ind.lernzielstatus === 'erreicht' ? '#059669'
                              : ind.lernzielstatus === 'teilweise_erreicht' ? '#D97706' : '#DC2626'
                            return (
                              <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: '#E9D5FF' }}>
                                <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                                  style={{ background: '#EDE9FE', color: '#5B21B6' }}>{ind.code}</span>
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: statusColor }}>
                                    {STATUS_LABEL[ind.lernzielstatus] ?? ind.lernzielstatus}
                                  </p>
                                  {ind.empfehlung && <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>{ind.empfehlung}</p>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
