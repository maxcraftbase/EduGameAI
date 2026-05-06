'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    startTransition(async () => {
      setError(null)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('E-Mail oder Passwort falsch.')
      } else {
        router.push('/playground')
        router.refresh()
      }
    })
  }

  return (
    <div className="w-full max-w-sm bg-background border rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">EduGame AI</h1>
        <p className="text-sm text-muted-foreground mt-1">Anmelden als Lehrkraft</p>
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
          <label htmlFor="password" className="block text-sm font-medium mb-1">Passwort</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          {isPending ? 'Anmelden…' : 'Anmelden'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        Noch kein Konto?{' '}
        <Link href="/signup" className="text-primary hover:underline">Registrieren</Link>
      </p>
    </div>
  )
}
