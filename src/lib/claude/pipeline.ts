import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Lädt einen Prompt aus der prompts/-Datei
function loadPrompt(filename: string): string {
  const promptPath = join(process.cwd(), 'prompts', filename)
  return readFileSync(promptPath, 'utf-8')
}

// Einzelner strukturierter KI-Call — gibt immer JSON zurück
async function callClaude(systemPrompt: string, userMessage: string): Promise<unknown> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // JSON aus der Antwort extrahieren
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/)
  if (!jsonMatch) throw new Error('KI hat kein gültiges JSON zurückgegeben')

  return JSON.parse(jsonMatch[1] || jsonMatch[0])
}

// --- Schritt 1–6: Materialanalyse ---------------------------
export async function analyzeMaterial(input: {
  materialText: string
  abschnitte: { id: string; text: string }[]
  kontext: { fach: string; jahrgangsstufe: string; schulform: string; bundesland: string }
}) {
  const systemPrompt = loadPrompt('01_material_analysis.md')
  const userMessage = JSON.stringify({
    material_text: input.materialText,
    material_abschnitte: input.abschnitte,
    kontext: input.kontext,
  })
  return callClaude(systemPrompt, userMessage)
}

// --- Schritt 7–10: Lernziel & Spielbarkeits-Ampel -----------
export async function determineLearningObjective(input: {
  analyse: unknown
  lernzielLehrkraft?: string
}) {
  const systemPrompt = loadPrompt('02_learning_objective.md')
  const userMessage = JSON.stringify({
    analyse: input.analyse,
    lernziel_lehrkraft: input.lernzielLehrkraft || null,
  })
  return callClaude(systemPrompt, userMessage)
}

// --- Schritt 11–16: Spielgenerierung -------------------------
export async function generateGame(input: {
  analyse: unknown
  lernziel: unknown
  kontext: { jahrgangsstufe: string; fach: string; zeitrahmenMinuten: number }
}) {
  const systemPrompt = loadPrompt('03_game_generation.md')
  const userMessage = JSON.stringify({
    analyse: input.analyse,
    lernziel: input.lernziel,
    kontext: {
      jahrgangsstufe: input.kontext.jahrgangsstufe,
      fach: input.kontext.fach,
      zeitrahmen_minuten: input.kontext.zeitrahmenMinuten,
    },
  })
  return callClaude(systemPrompt, userMessage)
}

// --- Schritt 17–21: Validierung & Lehrkraft-Check ------------
export async function validateAndCheck(input: {
  analyse: unknown
  lernziel: unknown
  spiel: unknown
  abschnitte: { id: string; text: string }[]
}) {
  const systemPrompt = loadPrompt('04_validation_lehrkraft_check.md')
  const userMessage = JSON.stringify({
    analyse: input.analyse,
    lernziel: input.lernziel,
    spiel: input.spiel,
    originalmaterial_abschnitte: input.abschnitte,
  })
  return callClaude(systemPrompt, userMessage)
}

// --- Lernstandsdiagnose --------------------------------------
export async function runDiagnosis(input: {
  spielMetadaten: unknown
  aufgabenMetadaten: unknown[]
  schuelerErgebnisse: unknown[]
  modus: 'kompakt' | 'detail'
}) {
  const systemPrompt = loadPrompt('05_diagnosis_engine.md')
  const userMessage = JSON.stringify({
    spiel_metadaten: input.spielMetadaten,
    aufgaben_metadaten: input.aufgabenMetadaten,
    schueler_ergebnisse: input.schuelerErgebnisse,
    ausgabemodus: input.modus,
  })
  return callClaude(systemPrompt, userMessage)
}

// --- Vollständige 21-Schritt-Pipeline ------------------------
export async function runFullPipeline(input: {
  materialText: string
  abschnitte: { id: string; text: string }[]
  kontext: {
    fach: string
    jahrgangsstufe: string
    schulform: string
    bundesland: string
    zeitrahmenMinuten: number
  }
  lernzielLehrkraft?: string
}) {
  const analyse = await analyzeMaterial(input)
  const lernziel = await determineLearningObjective({ analyse, lernzielLehrkraft: input.lernzielLehrkraft })
  const spiel = await generateGame({ analyse, lernziel, kontext: input.kontext })
  const check = await validateAndCheck({ analyse, lernziel, spiel, abschnitte: input.abschnitte })

  return { analyse, lernziel, spiel, check }
}
