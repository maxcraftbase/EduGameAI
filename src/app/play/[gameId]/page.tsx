'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GameEngine } from '@/components/game/GameEngine'

type Phase = 'entry' | 'loading' | 'playing' | 'error'
type Differenzierungsniveau = 'leichter' | 'mittel' | 'schwer' | 'sehr_schwer'

interface SessionData {
  sessionId: string
  aufgaben: unknown[]
  gameSkin: string
}

const SKIN_EMOJI: Record<string, string> = {
  unterstufe: '🐾',
  mittelstufe: '🚀',
  oberstufe: '📊',
}
const SKIN_LABEL: Record<string, string> = {
  unterstufe: 'Lern-Abenteuer',
  mittelstufe: 'Mission',
  oberstufe: 'Analyse-Modus',
}

function PlayInner({ gameId }: { gameId: string }) {
  const [phase, setPhase] = useState<Phase>('entry')
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [niveau] = useState<Differenzierungsniveau>('mittel')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()

  function startSession(code: string) {
    startTransition(async () => {
      setPhase('loading')
      setError(null)
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spielId: gameId, code, differenzierungsniveau: niveau }),
        })
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? 'Spiel nicht gefunden')
        }
        const data = await res.json()
        setSessionData({
          sessionId: data.session.id,
          aufgaben: data.aufgaben,
          gameSkin: data.game_skin ?? 'mittelstufe',
        })
        setPhase('playing')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
        setPhase('error')
      }
    })
  }

  // Auto-start wenn Code per URL übergeben (von /spielen)
  useEffect(() => {
    const codeParam = searchParams.get('code')
    if (codeParam && phase === 'entry') {
      startSession(codeParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSubmitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const code = (e.currentTarget.elements.namedItem('code') as HTMLInputElement).value.trim().toUpperCase()
    startSession(code)
  }

  if (phase === 'playing' && sessionData) {
    return (
      <div className="min-h-screen bg-background">
        <GameEngine
          sessionId={sessionData.sessionId}
          aufgaben={sessionData.aufgaben as Parameters<typeof GameEngine>[0]['aufgaben']}
          niveau={niveau}
          gameSkin={sessionData.gameSkin}
          gameId={gameId}
        />
      </div>
    )
  }

  const skin = sessionData?.gameSkin ?? 'mittelstufe'

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-sm">
        {phase === 'loading' && (
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">{SKIN_EMOJI[skin]}</div>
            <p className="text-muted-foreground text-sm">Spiel wird geladen…</p>
          </div>
        )}

        {(phase === 'entry' || phase === 'error') && (
          <div className="bg-background border rounded-2xl shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{SKIN_EMOJI[skin]}</div>
              <h1 className="text-xl font-bold">{SKIN_LABEL[skin]}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gib deinen Tier-Code ein, den du von deiner Lehrkraft bekommen hast
              </p>
            </div>

            <form onSubmit={onSubmitCode} className="flex flex-col gap-4">
              <input
                name="code"
                type="text"
                required
                autoFocus
                autoComplete="off"
                placeholder="z.B. TIGER-7K2"
                className="w-full border rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Laden…' : 'Los geht\'s →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const [gameId, setGameId] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ gameId: id }) => setGameId(id))
  }, [params])

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🚀</div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🚀</div>
      </div>
    }>
      <PlayInner gameId={gameId} />
    </Suspense>
  )
}
