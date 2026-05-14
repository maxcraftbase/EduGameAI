import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Kein Code angegeben' }, { status: 400 })
    }

    const supabase = await createClient()
    const normalizedCode = code.trim().toUpperCase()

    // 1. Code in students-Tabelle nachschlagen → Klasse ermitteln
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, class_id, classes(id, name, fach, jahrgangsstufe)')
      .eq('code', normalizedCode)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Code nicht gefunden. Bitte überprüfe deinen Zettel.' }, { status: 404 })
    }

    // 2. Zugewiesene Spiele der Klasse laden
    const { data: classGames } = await supabase
      .from('class_games')
      .select('game_id, games(id, titel, spieltyp_didaktisch, game_engine)')
      .eq('class_id', student.class_id)

    const games = (classGames ?? [])
      .map((cg) => (Array.isArray(cg.games) ? cg.games[0] : cg.games))
      .filter(Boolean)

    if (games.length === 0) {
      return NextResponse.json({
        error: 'Deiner Klasse wurde noch kein Spiel zugewiesen. Frag deine Lehrkraft.'
      }, { status: 404 })
    }

    return NextResponse.json({
      studentId: student.id,
      code: normalizedCode,
      klasse: student.classes,
      spiele: games,
    })
  } catch (err) {
    console.error('[student/lookup]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
