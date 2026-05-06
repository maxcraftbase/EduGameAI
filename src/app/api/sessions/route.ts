import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Neue Schüler-Session starten (kein Login, nur Spielcode)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { spielId, code, differenzierungsniveau = 'mittel' } = body

    if (!spielId || !code) {
      return NextResponse.json({ error: 'spielId und code erforderlich' }, { status: 400 })
    }

    // Prüfen ob Spiel freigegeben
    const { data: spiel } = await supabase
      .from('games')
      .select('id, status, aufgaben, game_skin')
      .eq('id', spielId)
      .eq('status', 'freigegeben')
      .single()

    if (!spiel) {
      return NextResponse.json({ error: 'Spiel nicht gefunden oder nicht freigegeben' }, { status: 404 })
    }

    const { data: session, error } = await supabase
      .from('student_sessions')
      .insert({ spiel_id: spielId, code, differenzierungsniveau })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session, aufgaben: spiel.aufgaben, game_skin: spiel.game_skin })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Session konnte nicht gestartet werden' }, { status: 500 })
  }
}
