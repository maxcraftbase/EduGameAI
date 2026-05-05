import { NextRequest, NextResponse } from 'next/server'
import { runFullPipeline } from '@/lib/claude/pipeline'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const body = await request.json()
    const { materialId, lernzielLehrkraft } = body

    // Material aus DB laden
    const { data: material, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('lehrer_id', user.id)
      .single()

    if (error || !material) {
      return NextResponse.json({ error: 'Material nicht gefunden' }, { status: 404 })
    }

    // 21-Schritt-Pipeline ausführen
    const result = await runFullPipeline({
      materialText: material.extrahierter_text,
      abschnitte: material.abschnitte,
      kontext: {
        fach: material.fach,
        jahrgangsstufe: material.jahrgangsstufe,
        schulform: material.schulform,
        bundesland: material.bundesland,
        zeitrahmenMinuten: 15,
      },
      lernzielLehrkraft,
    })

    // Ergebnisse in DB speichern
    const { data: analyse } = await supabase
      .from('analyses')
      .insert({ material_id: materialId, raw_output: result.analyse as Record<string, unknown> })
      .select().single()

    const { data: spiel } = await supabase
      .from('games')
      .insert({ analyse_id: analyse?.id, lehrer_id: user.id, raw_output: result.spiel as Record<string, unknown>, status: 'entwurf' })
      .select().single()

    await supabase.from('lehrkraft_checks').insert({ spiel_id: spiel?.id, raw_output: result.check as Record<string, unknown> })

    return NextResponse.json({ analyse, spiel, check: result.check })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 })
  }
}
