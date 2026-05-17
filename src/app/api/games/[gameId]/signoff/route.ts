import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { error: spielError } = await supabase
      .from('games')
      .update({ status: 'freigegeben' })
      .eq('id', gameId)
      .eq('lehrer_id', user.id)

    if (spielError) throw spielError

    await supabase
      .from('lehrkraft_checks')
      .update({ signoff_lehrkraft: true })
      .eq('spiel_id', gameId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Freigabe fehlgeschlagen' }, { status: 500 })
  }
}
