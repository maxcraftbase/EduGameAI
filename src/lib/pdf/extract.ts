import { MaterialAbschnitt } from '@/types'

// PDF-Text extrahieren und in Abschnitte aufteilen
export async function extractTextFromPDF(buffer: Buffer): Promise<{
  fullText: string
  abschnitte: MaterialAbschnitt[]
}> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const data = await pdfParse(buffer as unknown) as { text: string }

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
