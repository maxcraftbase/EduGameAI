'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

export default function EinstellungenPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [logoutPending, setLogoutPending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
      setLoading(false)
    })
  }, [])

  async function onLogout() {
    setLogoutPending(true)
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1F1235' }}>Einstellungen</h1>
        <p className="text-sm mt-1" style={{ color: '#7A6A94' }}>Account und Präferenzen verwalten</p>
      </div>

      {/* Account */}
      <div style={cardStyle} className="p-6 mb-5">
        <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Account</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }}>
            L
          </div>
          <div>
            <p className="font-semibold" style={{ color: '#1F1235' }}>Lehrkraft</p>
            <p className="text-sm" style={{ color: '#7A6A94' }}>{loading ? '…' : email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>E-Mail-Adresse</label>
            <input type="email" value={email} disabled
              style={{ ...inputStyle, background: '#F3EEFF', color: '#7A6A94', cursor: 'not-allowed' }} />
            <p className="text-xs mt-1.5" style={{ color: '#7A6A94' }}>E-Mail-Änderungen kommen bald</p>
          </div>
        </div>
      </div>

      {/* Abonnement */}
      <div style={cardStyle} className="p-6 mb-5">
        <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Abonnement</h2>
        <div className="flex items-center justify-between rounded-xl px-5 py-4"
          style={{ background: 'linear-gradient(135deg, #7C3AED08, #A855F705)', border: '1px solid #E9D5FF' }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#1F1235' }}>Free Plan</p>
            <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>Bis zu 5 Spiele · 1 Klasse</p>
          </div>
          <span className="rounded-xl px-4 py-2 text-xs font-bold"
            style={{ background: '#EDE9FE', color: '#7C3AED', border: '1px solid #C4B5FD' }}>
            Kostenlos
          </span>
        </div>
        <p className="text-xs mt-3" style={{ color: '#7A6A94' }}>Pro-Plan mit unbegrenzten Spielen kommt bald.</p>
      </div>

      {/* Datenschutz */}
      <div style={cardStyle} className="p-6 mb-5">
        <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Datenschutz & DSGVO</h2>
        <div className="flex flex-col gap-3">
          {[
            { icon: '🔒', title: 'Anonym-Codes', desc: 'Schüler spielen ohne Namen oder E-Mail — vollständig DSGVO-konform' },
            { icon: '🇩🇪', title: 'Daten in Deutschland', desc: 'Alle Daten werden auf europäischen Servern verarbeitet' },
            { icon: '🗑️', title: 'Daten löschen', desc: 'Du kannst deinen Account und alle Daten jederzeit löschen (kommt bald)' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 py-3 border-b last:border-0"
              style={{ borderColor: '#F3EEFF' }}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1F1235' }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A6A94' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={cardStyle} className="p-6">
        <h2 className="font-bold mb-4" style={{ color: '#1F1235' }}>Session</h2>
        <button onClick={onLogout} disabled={logoutPending}
          className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
          style={{
            background: logoutPending ? '#FEE2E2' : '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            opacity: logoutPending ? 0.7 : 1,
          }}>
          {logoutPending ? 'Abmelden…' : '← Abmelden'}
        </button>
      </div>
    </div>
  )
}
