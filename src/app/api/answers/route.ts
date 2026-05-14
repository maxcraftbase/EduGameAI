import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Schülerantwort speichern + regelbasiert auswerten
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      sessionId,
      aufgabeId,
      antwortWert,
      versuche = 1,
      helfenGenutzt = 0,
      bearbeitungszeitSekunden = null,
      abgebrochen = false,
    } = body

    if (!sessionId || !aufgabeId || antwortWert === undefined) {
      return NextResponse.json({ error: 'sessionId, aufgabeId und antwortWert erforderlich' }, { status: 400 })
    }

    // Session + Spiel laden um Lösungen zu prüfen
    const { data: session } = await supabase
      .from('student_sessions')
      .select('id, spiel_id, differenzierungsniveau')
      .eq('id', sessionId)
      .single()

    if (!session) return NextResponse.json({ error: 'Session nicht gefunden' }, { status: 404 })

    const { data: spiel } = await supabase
      .from('games')
      .select('aufgaben, status')
      .eq('id', session.spiel_id)
      .single()

    if (!spiel || spiel.status !== 'freigegeben') {
      return NextResponse.json({ error: 'Spiel nicht verfügbar' }, { status: 403 })
    }

    // Aufgabe aus dem Spiel suchen
    const aufgaben = (spiel?.aufgaben ?? []) as Array<{
      aufgabe_id: string
      loesungen: string[]
      teilloesungen?: string[]
      feedbackbausteine?: { bei_korrekt: string; bei_falsch: string }
    }>
    const aufgabe = aufgaben.find((a) => a.aufgabe_id === aufgabeId)

    // Regelbasierte Auswertung
    let status: 'korrekt' | 'teilweise_korrekt' | 'falsch' = 'falsch'
    let ausgeloestes_feedback = ''

    if (aufgabe) {
      const antworten = Array.isArray(antwortWert) ? antwortWert : [antwortWert]
      const loesungen = aufgabe.loesungen.map((l) => l.toLowerCase().trim())
      const teilloesungen = (aufgabe.teilloesungen ?? []).map((l) => l.toLowerCase().trim())

      const alleKorrekt = antworten.every((a) => loesungen.includes(a.toLowerCase().trim()))
      const irgendeineTeil = antworten.some((a) =>
        teilloesungen.includes(a.toLowerCase().trim())
      )

      if (alleKorrekt && antworten.length >= loesungen.length) {
        status = 'korrekt'
        ausgeloestes_feedback = aufgabe.feedbackbausteine?.bei_korrekt ?? ''
      } else if (irgendeineTeil) {
        status = 'teilweise_korrekt'
        ausgeloestes_feedback = aufgabe.feedbackbausteine?.bei_falsch ?? ''
      } else {
        status = 'falsch'
        ausgeloestes_feedback = aufgabe.feedbackbausteine?.bei_falsch ?? ''
      }
    }

    const { data: antwort, error } = await supabase
      .from('answers')
      .insert({
        session_id: sessionId,
        aufgabe_id: aufgabeId,
        antwort_wert: JSON.stringify(antwortWert),
        status,
        versuche,
        hilfen_genutzt: helfenGenutzt,
        bearbeitungszeit_sekunden: bearbeitungszeitSekunden,
        ausgeloestes_feedback,
        abgebrochen,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ antwort, status, feedback: ausgeloestes_feedback })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Antwort konnte nicht gespeichert werden' }, { status: 500 })
  }
}
