import { NextRequest, NextResponse } from 'next/server'
import { runDiagnosis } from '@/lib/claude/pipeline'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const body = await request.json()
    const { spielId, modus = 'kompakt' } = body

    // Spiel + Aufgaben laden
    const { data: spiel } = await supabase
      .from('games')
      .select('*, analyses(*)')
      .eq('id', spielId)
      .eq('lehrer_id', user.id)
      .single()

    if (!spiel) return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 })

    // Schülerantworten laden
    const { data: sessions } = await supabase
      .from('student_sessions')
      .select('*, answers(*)')
      .eq('spiel_id', spielId)

    const diagnose = await runDiagnosis({
      spielMetadaten: spiel.analyses,
      aufgabenMetadaten: spiel.aufgaben || [],
      schuelerErgebnisse: sessions || [],
      modus,
    })

    return NextResponse.json({ diagnose })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Diagnose fehlgeschlagen' }, { status: 500 })
  }
}
