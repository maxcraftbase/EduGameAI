'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    startTransition(async () => {
      setError(null)
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="w-full max-w-sm bg-background border rounded-xl shadow-sm p-8 text-center">
        <div className="text-2xl mb-3">📬</div>
        <h2 className="font-bold text-lg mb-2">Bestätigungs-E-Mail gesendet</h2>
        <p className="text-sm text-muted-foreground">
          Klicken Sie auf den Link in Ihrer E-Mail, um Ihr Konto zu aktivieren.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-background border rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">EduGame AI</h1>
        <p className="text-sm text-muted-foreground mt-1">Konto erstellen</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Passwort <span className="text-muted-foreground font-normal">(min. 8 Zeichen)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Registrieren…' : 'Registrieren'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        Bereits ein Konto?{' '}
        <Link href="/login" className="text-primary hover:underline">Anmelden</Link>
      </p>
    </div>
  )
}
