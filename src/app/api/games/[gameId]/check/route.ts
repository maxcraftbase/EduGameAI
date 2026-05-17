import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data, error } = await supabase
    .from('lehrkraft_checks')
    .select('*')
    .eq('spiel_id', gameId)
    .single()

  if (error || !data) return NextResponse.json({ pending: true }, { status: 202 })

  return NextResponse.json({ pending: false, check: data })
}
