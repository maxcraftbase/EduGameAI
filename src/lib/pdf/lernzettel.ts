interface LernzettelData {
  titel: string
  spieltyp_didaktisch: string | null
  zusammenfassung: string | null
  kernaussagen: { aussage: string; wichtigkeit?: string }[]
  lernziel: string | null
}

const PURPLE = [124, 58, 237] as const
const PURPLE_LIGHT = [245, 240, 255] as const
const GRAY = [100, 100, 120] as const
const DARK = [20, 20, 35] as const

function wrapText(text: string, maxWidth: number, charPerMm: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  const maxChars = Math.floor(maxWidth * charPerMm)

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function generateLernzettelPDF(data: LernzettelData): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = 210
  const margin = 18
  const contentW = pageW - margin * 2
  const datum = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  let y = 0

  // ── Header-Banner ────────────────────────────────────────
  doc.setFillColor(...PURPLE)
  doc.rect(0, 0, pageW, 38, 'F')

  // Logo-Kachel
  doc.setFillColor(160, 90, 255)
  doc.roundedRect(margin, 9, 18, 18, 3, 3, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('E', margin + 9, 21, { align: 'center' })

  // App-Name
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('EduGame AI', margin + 22, 17)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(210, 190, 255)
  doc.text('Dein persönlicher Lernzettel', margin + 22, 23)

  // Datum rechts
  doc.setFontSize(8)
  doc.setTextColor(210, 190, 255)
  doc.text(datum, pageW - margin, 21, { align: 'right' })

  y = 46

  // ── Spieltitel ───────────────────────────────────────────
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  const titelLines = doc.splitTextToSize(data.titel, contentW)
  doc.text(titelLines, margin, y)
  y += titelLines.length * 7 + 2

  if (data.spieltyp_didaktisch) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text(data.spieltyp_didaktisch, margin, y)
    y += 6
  }

  // Trennlinie
  doc.setDrawColor(...PURPLE)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── Lernziel ─────────────────────────────────────────────
  if (data.lernziel) {
    doc.setFillColor(...PURPLE_LIGHT)
    const lzLines = doc.splitTextToSize(data.lernziel, contentW - 16)
    const boxH = lzLines.length * 5.5 + 14
    doc.roundedRect(margin, y, contentW, boxH, 3, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PURPLE)
    doc.text('📚  Was ich heute gelernt habe', margin + 6, y + 8)

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(lzLines, margin + 6, y + 14)
    y += boxH + 10
  }

  // ── Zusammenfassung ──────────────────────────────────────
  if (data.zusammenfassung) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('Zusammenfassung', margin, y)
    y += 6

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50, 50, 70)
    const zsLines = doc.splitTextToSize(data.zusammenfassung, contentW)
    doc.text(zsLines, margin, y)
    y += zsLines.length * 5 + 10
  }

  // ── Kernaussagen ─────────────────────────────────────────
  const kernaussagen = data.kernaussagen?.filter(Boolean) ?? []
  if (kernaussagen.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('Kernaussagen', margin, y)
    y += 6

    for (const k of kernaussagen) {
      const text = typeof k === 'string' ? k : k.aussage
      if (!text) continue

      // Neue Seite falls nötig
      if (y > 265) {
        doc.addPage()
        y = 20
      }

      doc.setFillColor(...PURPLE)
      doc.circle(margin + 2, y - 1.5, 1.2, 'F')

      doc.setFontSize(9.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 70)
      const lines = doc.splitTextToSize(text, contentW - 10)
      doc.text(lines, margin + 7, y)
      y += lines.length * 5 + 3
    }
    y += 4
  }

  // ── Footer ───────────────────────────────────────────────
  const footerY = 287
  doc.setFillColor(...PURPLE)
  doc.rect(0, footerY - 2, pageW, 12, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('🌟  Super gemacht!', margin, footerY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(210, 190, 255)
  doc.text('EduGame AI · Lernzettel', pageW - margin, footerY + 5, { align: 'right' })

  const dateiname = `Lernzettel_${data.titel.replace(/[^a-zA-Z0-9äöüÄÖÜ]/g, '_').slice(0, 40)}.pdf`
  doc.save(dateiname)
}
