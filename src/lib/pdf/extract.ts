import { extractText } from 'unpdf'
import { MaterialAbschnitt } from '@/types'

export async function extractTextFromPDF(buffer: Buffer): Promise<{
  fullText: string
  abschnitte: MaterialAbschnitt[]
}> {
  const { text: pages } = await extractText(new Uint8Array(buffer))
  const fullText = pages.join('\n\n')

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
