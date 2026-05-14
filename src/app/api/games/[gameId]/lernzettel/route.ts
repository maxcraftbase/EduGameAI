import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Öffentlich: Schüler holen nach dem Spiel die Lernzettel-Daten (kein Login nötig)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()

  const { data: spiel } = await supabase
    .from('games')
    .select('id, titel, spieltyp_didaktisch, analyse_id, status')
    .eq('id', gameId)
    .eq('status', 'freigegeben')
    .single()

  if (!spiel) {
    return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 })
  }

  const { data: analyse } = await supabase
    .from('analyses')
    .select('zusammenfassung, kernaussagen, lernziel_original, lernziel_mvp_variante')
    .eq('id', spiel.analyse_id)
    .single()

  return NextResponse.json({
    titel: spiel.titel,
    spieltyp_didaktisch: spiel.spieltyp_didaktisch,
    zusammenfassung: analyse?.zusammenfassung ?? null,
    kernaussagen: analyse?.kernaussagen ?? [],
    lernziel: analyse?.lernziel_mvp_variante ?? analyse?.lernziel_original ?? null,
  })
}
