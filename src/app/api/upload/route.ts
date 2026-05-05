import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf/extract'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fach = formData.get('fach') as string
    const jahrgangsstufe = formData.get('jahrgangsstufe') as string
    const schulform = formData.get('schulform') as string
    const bundesland = formData.get('bundesland') as string

    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const { fullText, abschnitte } = await extractTextFromPDF(buffer)

    // Material in Supabase speichern
    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        lehrer_id: user.id,
        dateiname: file.name,
        extrahierter_text: fullText,
        abschnitte,
        fach,
        jahrgangsstufe,
        schulform,
        bundesland,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ material })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}
