import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const { aufgaben } = body

  if (!Array.isArray(aufgaben)) {
    return NextResponse.json({ error: 'aufgaben muss ein Array sein' }, { status: 400 })
  }

  const { error } = await supabase
    .from('games')
    .update({ aufgaben })
    .eq('id', gameId)
    .eq('lehrer_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
