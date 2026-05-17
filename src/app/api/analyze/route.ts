import { NextRequest, NextResponse } from 'next/server'
import { runFullPipeline, validateAndCheck, PipelineValidationError, PipelineJsonError, PipelineApiError } from '@/lib/claude/pipeline'
import { createClient } from '@/lib/supabase/server'
import type { AnalyseOutput, LernzielOutput, LernpfadOutput, SpielmappingOutput, SpielOutput, ValidationOutput } from '@/lib/schemas/pipeline'

const enc = new TextEncoder()
function sseEvent(data: Record<string, unknown>) {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json()
  const { materialId, spielname, lernzielLehrkraft, zeitrahmenMinuten = 15, erlaubteFormate } = body
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

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => controller.enqueue(sseEvent(data))

      try {
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
          erlaubteFormate: Array.isArray(erlaubteFormate) ? erlaubteFormate : undefined,
          onProgress: (e) => send({ type: 'progress', ...e }),
        })

        const { data: analyse, error: analyseError } = await supabase
          .from('analyses')
          .insert(buildAnalyseRow(materialId, result.analyse, result.lernziel, result.lernpfad, result.spielmapping))
          .select()
          .single()
        if (analyseError) throw analyseError

        const { data: spiel, error: spielError } = await supabase
          .from('games')
          .insert(buildSpielRow(analyse.id, user.id, result.spiel, result.spielmapping, spielname))
          .select()
          .single()
        if (spielError) throw spielError

        // Spiel ist fertig — sofort done senden (nur IDs, kein großer Payload)
        send({ type: 'done', analyseId: analyse.id, spielId: spiel.id })

        // Stream bleibt offen während Validierung läuft — verhindert vorzeitigen Funktionsabbruch
        await validateAndCheck({
          analyse: result.analyse,
          lernziel: result.lernziel,
          lernpfad: result.lernpfad,
          spielmapping: result.spielmapping,
          spiel: result.spiel,
          abschnitte: material.abschnitte,
        }).then((check) => {
          return supabase.from('lehrkraft_checks').insert(buildCheckRow(spiel.id, check))
        }).catch((err) => {
          console.error('[analyze] Validierung fehlgeschlagen:', err)
        })

      } catch (err) {
        let message = 'Analyse fehlgeschlagen'
        if (err instanceof PipelineValidationError) message = `Validierungsfehler: ${err.message}`
        else if (err instanceof PipelineJsonError) message = `KI hat kein JSON zurückgegeben: ${err.schritt}`
        else if (err instanceof PipelineApiError) message = `KI-API nicht erreichbar: ${err.schritt}`
        else {
          const detail = err instanceof Error ? err.message : JSON.stringify(err)
          message = `Analyse fehlgeschlagen: ${detail}`
          console.error('[analyze]', err)
        }
        send({ type: 'error', message })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

function buildAnalyseRow(
  materialId: string,
  a: AnalyseOutput,
  l: LernzielOutput,
  lp: LernpfadOutput,
  sm: SpielmappingOutput
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
    lernpfad: lp,
    spielmapping: sm,
  }
}

function buildSpielRow(analyseId: string, lehrerId: string, s: SpielOutput, sm: SpielmappingOutput, spielname?: string) {
  const selectedVorschlag = sm.vorschlaege.find(v => v.rang === sm.ausgewaehlter_vorschlag_rang)
  const aufgaben = s.schritt_14_aufgaben.map((q) => ({
    aufgabe_id: q.aufgabe_id,
    text: q.text,
    antwortformat: q.antwortformat,
    loesungen: q.loesungen,
    distraktoren: q.distraktoren,
    hilfen: q.hilfen,
    abschnitt_ref: q.abschnitt_ref,
    teilkompetenz: q.teilkompetenz,
    komplexitaetsstufe: q.komplexitaetsstufe,
  }))

  return {
    analyse_id: analyseId,
    lehrer_id: lehrerId,
    titel: spielname?.trim() || (selectedVorschlag ? `${selectedVorschlag.name} – ${new Date().toLocaleDateString('de-DE')}` : `Spiel – ${new Date().toLocaleDateString('de-DE')}`),
    spieltyp_didaktisch: s.schritt_13_spieltyp_didaktisch,
    game_engine: s.schritt_11_game_engine.engine_typ,
    game_skin: s.schritt_12_game_skin.altersstufe,
    aufgaben,
    zeitregelung_sekunden: null,
    zeitdruck_aktiv: false,
    status: 'entwurf',
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
  }
}
