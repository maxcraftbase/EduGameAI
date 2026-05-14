'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Spiel {
  id: string
  titel: string
  game_skin: string
  spieltyp_didaktisch: string
  status: 'entwurf' | 'freigegeben' | 'archiviert'
  erstellt_am: string
}

const STATUS_CONFIG = {
  freigegeben: { label: 'Freigegeben', bg: '#D1FAE5', color: '#059669', border: '#6EE7B7' },
  entwurf: { label: 'Entwurf', bg: '#F3EEFF', color: '#7C3AED', border: '#C4B5FD' },
  archiviert: { label: 'Archiviert', bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' },
}

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E9D5FF',
  boxShadow: '0 2px 24px rgba(124,58,237,0.08)',
  borderRadius: 20,
}

export default function SpielePage() {
  const [spiele, setSpiele] = useState<Spiel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'alle' | 'freigegeben' | 'entwurf'>('alle')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('games')
        .select('id, titel, game_skin, spieltyp_didaktisch, status, erstellt_am')
        .eq('lehrer_id', user.id)
        .order('erstellt_am', { ascending: false })
      setSpiele(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'alle' ? spiele : spiele.filter((s) => s.status === filter)

  const counts = {
    alle: spiele.length,
    freigegeben: spiele.filter((s) => s.status === 'freigegeben').length,
    entwurf: spiele.filter((s) => s.status === 'entwurf').length,
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F1235' }}>Spiele & Ordner</h1>
          <p className="text-sm mt-1" style={{ color: '#7A6A94' }}>Alle generierten Spiele verwalten und freigeben</p>
        </div>
        <Link href="/playground"
          className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', textDecoration: 'none' }}>
          ✦ Neues Spiel
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['alle', 'freigegeben', 'entwurf'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-all capitalize"
            style={{
              background: filter === f ? '#7C3AED' : '#FFFFFF',
              color: filter === f ? '#FFFFFF' : '#7A6A94',
              border: filter === f ? '1px solid #7C3AED' : '1px solid #E9D5FF',
            }}>
            {f === 'alle' ? 'Alle' : f === 'freigegeben' ? 'Freigegeben' : 'Entwürfe'}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: filter === f ? 'rgba(255,255,255,0.25)' : '#F3EEFF',
                color: filter === f ? 'white' : '#7C3AED',
              }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#F3EEFF' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ border: '2px dashed #E9D5FF', borderRadius: 20 }} className="p-16 text-center">
          <span className="text-4xl mb-3 block">🎮</span>
          <p className="text-sm font-medium" style={{ color: '#7A6A94' }}>
            {filter === 'alle' ? 'Noch keine Spiele erstellt' : `Keine ${filter === 'freigegeben' ? 'freigegebenen' : 'Entwurfs'}-Spiele`}
          </p>
          <p className="text-xs mt-1" style={{ color: '#C4B5FD' }}>
            {filter === 'alle' ? 'Lade Material hoch um loszulegen' : 'Wechsle zum Filter „Alle"'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((spiel) => {
            const statusCfg = STATUS_CONFIG[spiel.status] ?? STATUS_CONFIG.entwurf
            return (
              <div key={spiel.id} style={{ ...cardStyle, borderRadius: 16 }} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: '#F3EEFF' }}>🎮</div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: '#1F1235' }}>
                    {spiel.titel || 'Unbenanntes Spiel'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>
                    {[spiel.spieltyp_didaktisch, spiel.game_skin]
                      .filter(Boolean).join(' · ')} · {new Date(spiel.erstellt_am).toLocaleDateString('de-DE')}
                  </p>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                  {statusCfg.label}
                </span>

                <Link href={`/modules/${spiel.id}`}
                  className="rounded-xl px-4 py-2 text-xs font-bold transition-all flex-shrink-0"
                  style={{ background: '#F3EEFF', color: '#7C3AED', border: '1px solid #E9D5FF', textDecoration: 'none' }}>
                  Öffnen →
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats summary at bottom */}
      {!loading && spiele.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Spiele gesamt', value: spiele.length, icon: '🎮', color: '#7C3AED', bg: '#EDE9FE' },
            { label: 'Freigegeben', value: counts.freigegeben, icon: '✅', color: '#059669', bg: '#D1FAE5' },
            { label: 'Entwürfe', value: counts.entwurf, icon: '✏️', color: '#D97706', bg: '#FEF3C7' },
          ].map((stat) => (
            <div key={stat.label} style={cardStyle} className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: stat.bg }}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: '#1F1235' }}>{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
