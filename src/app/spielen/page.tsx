'use client'

import { useState, useRef } from 'react'

type Step = 'enter' | 'found' | 'error'

interface SpielInfo {
  id: string
  titel: string
  spieltyp_didaktisch?: string
}

interface LookupResult {
  studentId: string
  code: string
  klasse: { id: string; name: string; fach: string; jahrgangsstufe: string }
  spiele: SpielInfo[]
}

export default function SpielerPage() {
  const [step, setStep] = useState<Step>('enter')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!codeInput.trim()) return
    setLoading(true)
    setErrorMsg('')

    const res = await fetch('/api/student/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeInput.trim() }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setErrorMsg(data.error ?? 'Unbekannter Fehler')
      setStep('error')
      return
    }

    setResult(data)
    setStep('found')
  }

  function onReset() {
    setStep('enter')
    setCodeInput('')
    setResult(null)
    setErrorMsg('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 0 32px rgba(168,85,247,0.5)' }}>
          E
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none">EduGame AI</p>
          <p className="text-xs mt-0.5" style={{ color: '#C4B5FD' }}>Schüler-Zugang</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-3xl p-8"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(196,181,253,0.2)', backdropFilter: 'blur(20px)' }}>

        {/* ── Step: Code eingeben ── */}
        {(step === 'enter' || step === 'error') && (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎮</div>
              <h1 className="text-2xl font-black text-white mb-2">Bereit zum Spielen?</h1>
              <p style={{ color: '#C4B5FD', fontSize: 15 }}>
                Gib den Code von deinem Zettel ein
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="z.B. FUCHS-1234"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="w-full text-center font-mono text-xl font-bold tracking-widest rounded-2xl px-5 py-4 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: step === 'error' ? '2px solid rgba(248,113,113,0.6)' : '2px solid rgba(196,181,253,0.3)',
                    color: '#FFFFFF',
                    letterSpacing: '0.12em',
                  }}
                  onFocus={(e) => e.target.style.border = '2px solid rgba(168,85,247,0.8)'}
                  onBlur={(e) => e.target.style.border = step === 'error' ? '2px solid rgba(248,113,113,0.6)' : '2px solid rgba(196,181,253,0.3)'}
                />
              </div>

              {step === 'error' && (
                <div className="rounded-2xl px-4 py-3 text-sm text-center"
                  style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#FCA5A5' }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !codeInput.trim()}
                className="w-full rounded-2xl py-4 font-black text-lg transition-all"
                style={{
                  background: loading || !codeInput.trim()
                    ? 'rgba(124,58,237,0.3)'
                    : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  color: 'white',
                  boxShadow: loading || !codeInput.trim() ? 'none' : '0 0 32px rgba(168,85,247,0.4)',
                  cursor: loading || !codeInput.trim() ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}>
                {loading ? '⟳ Suche...' : 'Los geht\'s →'}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: 'rgba(196,181,253,0.5)' }}>
              Keinen Code? Frag deine Lehrkraft.
            </p>
          </>
        )}

        {/* ── Step: Spiel gefunden ── */}
        {step === 'found' && result && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🎯</div>
              <h1 className="text-xl font-black text-white mb-1">Dein Code wurde gefunden!</h1>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mt-2"
                style={{ background: 'rgba(196,181,253,0.15)', border: '1px solid rgba(196,181,253,0.3)' }}>
                <span className="font-mono font-bold text-sm" style={{ color: '#C4B5FD' }}>{result.code}</span>
                <span style={{ color: 'rgba(196,181,253,0.5)' }}>·</span>
                <span className="text-sm" style={{ color: '#C4B5FD' }}>
                  Klasse {result.klasse.jahrgangsstufe}{result.klasse.name} · {result.klasse.fach}
                </span>
              </div>
            </div>

            {/* Spiel(e) */}
            <div className="flex flex-col gap-3 mb-6">
              {result.spiele.map((spiel) => (
                <div key={spiel.id}
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'rgba(168,85,247,0.3)' }}>
                      🎮
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-base leading-tight">{spiel.titel}</p>
                      {spiel.spieltyp_didaktisch && (
                        <p className="text-xs mt-1" style={{ color: '#C4B5FD' }}>{spiel.spieltyp_didaktisch}</p>
                      )}
                    </div>
                  </div>

                  {/* Start-Button — Platzhalter bis Game-Engine fertig */}
                  <button
                    className="w-full mt-4 rounded-xl py-3 font-black text-base transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                      color: 'white',
                      border: 'none',
                      boxShadow: '0 0 24px rgba(168,85,247,0.5)',
                      cursor: 'pointer',
                    }}
                    onClick={() => alert('Spielstart kommt bald! 🚀')}>
                    ▶ Spiel starten
                  </button>
                </div>
              ))}
            </div>

            <button onClick={onReset}
              className="w-full text-sm py-2 rounded-xl transition-all"
              style={{ color: 'rgba(196,181,253,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Anderen Code eingeben
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs" style={{ color: 'rgba(196,181,253,0.3)' }}>
        EduGame AI · Kein Account nötig · DSGVO-konform
      </p>
    </div>
  )
}
