import { NextRequest, NextResponse } from 'next/server'
import { runFullPipeline, PipelineValidationError, PipelineJsonError, PipelineApiError } from '@/lib/claude/pipeline'
import { createClient } from '@/lib/supabase/server'
import type { AnalyseOutput, LernzielOutput, SpielOutput, ValidationOutput } from '@/lib/schemas/pipeline'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const body = await request.json()
    const { materialId, lernzielLehrkraft, zeitrahmenMinuten = 15 } = body

    if (!materialId) return NextResponse.json({ error: 'materialId fehlt' }, { status: 400 })

    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('lehrer_id', user.id)
      .single()

    if (materialError || !material) {
      return NextResponse.json({ error: 'Material nicht gefunden' }, { status: 404 })
    }

    const result = await runFullPipeline({
      materialText: material.extrahierter_text,
      abschnitte: material.abschnitte,
      kontext: {
        fach: material.fach,
        jahrgangsstufe: material.jahrgangsstufe,
        schulform: material.schulform,
        bundesland: material.bundesland,
        zeitrahmenMinuten,
      },
      lernzielLehrkraft,
    })

    // Analyse in DB speichern — alle Felder gemappt
    const { data: analyse, error: analyseError } = await supabase
      .from('analyses')
      .insert(buildAnalyseRow(materialId, result.analyse, result.lernziel))
      .select()
      .single()

    if (analyseError) throw analyseError

    // Spiel in DB speichern
    const { data: spiel, error: spielError } = await supabase
      .from('games')
      .insert(buildSpielRow(analyse.id, user.id, result.spiel))
      .select()
      .single()

    if (spielError) throw spielError

    // Lehrkraft-Check in DB speichern
    const { error: checkError } = await supabase
      .from('lehrkraft_checks')
      .insert(buildCheckRow(spiel.id, result.check))

    if (checkError) throw checkError

    return NextResponse.json({ analyseId: analyse.id, spielId: spiel.id, result })
  } catch (err) {
    if (err instanceof PipelineValidationError) {
      return NextResponse.json(
        { error: `Validierungsfehler: ${err.message}`, schritt: err.schritt },
        { status: 422 }
      )
    }
    if (err instanceof PipelineJsonError) {
      return NextResponse.json(
        { error: `KI hat kein JSON zurückgegeben: ${err.schritt}` },
        { status: 422 }
      )
    }
    if (err instanceof PipelineApiError) {
      return NextResponse.json(
        { error: `KI-API nicht erreichbar: ${err.schritt}` },
        { status: 503 }
      )
    }
    console.error(err)
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 })
  }
}

function buildAnalyseRow(
  materialId: string,
  a: AnalyseOutput,
  l: LernzielOutput
) {
  return {
    material_id: materialId,
    zusammenfassung: a.schritt_1_zusammenfassung,
    kernaussagen: a.schritt_2_kernaussagen,
    wissensform_primaer: a.schritt_3_wissensformen['primär'],
    wissensform_sekundaer: a.schritt_3_wissensformen['sekundär'],
    lernform_primaer: a.schritt_4_lernform['primär'],
    lernform_sekundaer: a.schritt_4_lernform['sekundär'],
    wissensstruktur: a.schritt_5_wissensstruktur.typ,
    denkhandlungen: a.schritt_5_wissensstruktur.denkhandlungen,
    komplexitaetsstufe: a.schritt_6_komplexitaet.stufe,
    lernziel_original: l.schritt_7_lernziel.original,
    lernziel_mvp_variante: l.schritt_9_ampel.lernziel_mvp_variante,
    spielbarkeit_ampel: l.schritt_9_ampel.farbe,
    spielbarer_anteil: l.schritt_8_spielbarkeit_analyse.spielbarer_anteil,
    nicht_spielbarer_anteil: l.schritt_8_spielbarkeit_analyse.nicht_spielbarer_anteil,
    antwortformat_primaer: l.schritt_10_antwortformat['primäres_format'],
    antwortformat_sekundaer: l.schritt_10_antwortformat['sekundäres_format'],
    spielfunktion: l.schritt_9_ampel.spielfunktion,
    abdeckung: l.schritt_9_ampel.abdeckung,
    raw_output: { analyse: a, lernziel: l } as Record<string, unknown>,
  }
}

function buildSpielRow(analyseId: string, lehrerId: string, s: SpielOutput) {
  // Aufgaben, Differenzierungen und Fehlvorstellungen zusammenführen
  const aufgaben = s.schritt_14_aufgaben.map((q) => {
    const diff = s.schritt_15_differenzierung.find((d) => d.aufgabe_id === q.aufgabe_id)
    const fehler = s.schritt_16_fehlvorstellungen.find((f) => f.aufgabe_id === q.aufgabe_id)
    return {
      ...q,
      differenzierungen: diff
        ? {
            leichter: diff.leichter,
            mittel: diff.mittel,
            schwer: diff.schwer,
            sehr_schwer: diff.sehr_schwer,
          }
        : null,
      fehlvorstellungen: fehler?.typische_fehler ?? [],
    }
  })

  return {
    analyse_id: analyseId,
    lehrer_id: lehrerId,
    titel: `Spiel – ${new Date().toLocaleDateString('de-DE')}`,
    spieltyp_didaktisch: s.schritt_13_spieltyp_didaktisch,
    game_engine: s.schritt_11_game_engine.engine_typ,
    game_skin: s.schritt_12_game_skin.altersstufe,
    aufgaben,
    status: 'entwurf',
    raw_output: s as unknown as Record<string, unknown>,
  }
}

function buildCheckRow(spielId: string, c: ValidationOutput) {
  const check = c.schritt_21_lehrkraft_check
  return {
    spiel_id: spielId,
    gesamtampel: check.gesamtampel,
    lernziel_original: check.lernziel_original,
    lernziel_mvp_variante: check.lernziel_mvp_variante,
    dimensionen: check.dimensionen,
    lernzielanteile: check.lernzielanteile,
    spielfunktion: check.spielfunktion,
    hinweise_fuer_lehrkraft: check.hinweise_fuer_lehrkraft,
    begruendung_anpassungen: check.begruendung_anpassungen,
    raw_output: c as unknown as Record<string, unknown>,
  }
}
