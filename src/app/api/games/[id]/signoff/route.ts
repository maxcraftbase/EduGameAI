import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Lehrkraft gibt Spiel frei
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    // Spiel-Status auf 'freigegeben' setzen
    const { error: spielError } = await supabase
      .from('games')
      .update({ status: 'freigegeben' })
      .eq('id', id)
      .eq('lehrer_id', user.id)

    if (spielError) throw spielError

    // Lehrkraft-Check Signoff setzen
    await supabase
      .from('lehrkraft_checks')
      .update({ signoff_lehrkraft: true })
      .eq('spiel_id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Freigabe fehlgeschlagen' }, { status: 500 })
  }
}
