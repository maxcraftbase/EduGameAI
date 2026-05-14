'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{
          background: 'oklch(0.16 0.04 285 / 80%)',
          border: '1px solid oklch(1 0 0 / 10%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px oklch(0 0 0 / 40%)',
        }}>
        <div className="text-3xl mb-4">📬</div>
        <h2 className="font-bold text-base mb-2 text-white">Fast geschafft!</h2>
        <p className="text-sm" style={{ color: 'oklch(0.65 0.05 290)' }}>
          Bestätigungs-E-Mail wurde gesendet. Klicken Sie auf den Link um Ihr Konto zu aktivieren.
        </p>
        <Link href="/login" className="inline-block mt-5 text-xs font-medium"
          style={{ color: 'oklch(0.70 0.15 290)' }}>
          ← Zurück zum Login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-2xl p-8"
      style={{
        background: 'oklch(0.16 0.04 285 / 80%)',
        border: '1px solid oklch(1 0 0 / 10%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 64px oklch(0 0 0 / 40%), inset 0 1px 0 oklch(1 0 0 / 8%)',
      }}>

      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'oklch(0.55 0.24 290)' }}>E</div>
          <span className="text-white font-semibold text-base tracking-tight">EduGame AI</span>
        </div>
        <p className="text-sm mt-3" style={{ color: 'oklch(0.65 0.05 290)' }}>
          Konto erstellen — kostenlos starten
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium mb-1.5"
            style={{ color: 'oklch(0.75 0.05 290)' }}>E-Mail</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@schule.de"
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'oklch(1 0 0 / 6%)',
              border: '1px solid oklch(1 0 0 / 12%)',
              color: 'oklch(0.95 0 0)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'oklch(0.55 0.24 290)'}
            onBlur={e => e.currentTarget.style.borderColor = 'oklch(1 0 0 / 12%)'}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium mb-1.5"
            style={{ color: 'oklch(0.75 0.05 290)' }}>
            Passwort <span style={{ color: 'oklch(0.50 0.04 290)' }}>(min. 8 Zeichen)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'oklch(1 0 0 / 6%)',
              border: '1px solid oklch(1 0 0 / 12%)',
              color: 'oklch(0.95 0 0)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'oklch(0.55 0.24 290)'}
            onBlur={e => e.currentTarget.style.borderColor = 'oklch(1 0 0 / 12%)'}
          />
        </div>

        {error && (
          <p className="text-xs rounded-lg px-3.5 py-2.5"
            style={{ background: 'oklch(0.45 0.2 27 / 20%)', color: 'oklch(0.80 0.15 27)', border: '1px solid oklch(0.55 0.2 27 / 30%)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 mt-1"
          style={{ background: 'oklch(0.55 0.24 290)', color: 'white', boxShadow: '0 4px 16px oklch(0.55 0.24 290 / 35%)' }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = 'oklch(0.60 0.24 290)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'oklch(0.55 0.24 290)')}
        >
          {loading ? 'Registrieren…' : 'Konto erstellen →'}
        </button>
      </form>

      <p className="text-xs text-center mt-5" style={{ color: 'oklch(0.55 0.05 290)' }}>
        Bereits ein Konto?{' '}
        <Link href="/login" className="font-medium transition-colors"
          style={{ color: 'oklch(0.70 0.15 290)' }}>
          Anmelden
        </Link>
      </p>
    </div>
  )
}
