import { MaterialAbschnitt } from '@/types'

// PDF-Text extrahieren und in Abschnitte aufteilen
export async function extractTextFromPDF(buffer: Buffer): Promise<{
  fullText: string
  abschnitte: MaterialAbschnitt[]
}> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)

  const fullText = data.text

  // Text in Abschnitte aufteilen (Absätze, min. 100 Zeichen)
  const rawAbschnitte = fullText
    .split(/\n{2,}/)
    .map((t) => t.replace(/\n/g, ' ').trim())
    .filter((t) => t.length > 100)

  const abschnitte: MaterialAbschnitt[] = rawAbschnitte.map((text, i) => ({
    id: `A${i + 1}`,
    text,
  }))

  return { fullText, abschnitte }
}
