import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { improveGame } from '@/lib/claude/pipeline'

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  // Spiel laden
  const { data: spiel, error: spielError } = await supabase
    .from('games')
    .select('*, analyses(*)')
    .eq('id', gameId)
    .eq('lehrer_id', user.id)
    .single()

  if (spielError || !spiel) {
    return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 })
  }

  // Lehrkraft-Check laden
  const { data: check, error: checkError } = await supabase
    .from('lehrkraft_checks')
    .select('*')
    .eq('spiel_id', gameId)
    .single()

  if (checkError || !check) {
    return NextResponse.json({ error: 'Kein Lehrkraft-Check vorhanden' }, { status: 404 })
  }

  const analyse = spiel.analyses

  try {
    const result = await improveGame({
      aufgaben: spiel.aufgaben ?? [],
      check: {
        gesamtampel: check.gesamtampel,
        dimensionen: check.dimensionen,
        hinweise_fuer_lehrkraft: check.hinweise_fuer_lehrkraft ?? [],
        lernzielanteile: check.lernzielanteile,
      },
      kontext: {
        lernziel: analyse?.lernziel_original ?? '',
        fach: analyse?.fach ?? '',
        jahrgangsstufe: analyse?.jahrgangsstufe ?? '',
        zusammenfassung: analyse?.zusammenfassung ?? '',
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'KI-Fehler'
    console.error('[improve]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
