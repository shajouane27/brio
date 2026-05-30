import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'

export interface PdfMetadata {
  niveau: string
  duree: string
  notation: string
}

type Line =
  | { kind: 'title'; text: string }
  | { kind: 'part'; text: string }
  | { kind: 'question'; text: string; points: string }
  | { kind: 'instruction'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'separator' }

// ── helpers ──────────────────────────────────────────────────────────────────

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

/** Strip light markdown: **bold**, *italic*, leading #/- */
function stripMd(text: string): string {
  return text
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/^\s*[-*]\s+/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim()
}

// ── parser ───────────────────────────────────────────────────────────────────

function parseContent(raw: string): Line[] {
  const lines: Line[] = []

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim()
    if (!line || line === '---') {
      lines.push({ kind: 'separator' })
      continue
    }

    // Title: # or ##
    if (/^#{1,2}\s/.test(line)) {
      lines.push({ kind: 'title', text: stripMd(line) })
      continue
    }

    // Part header: ### or Roman numeral I. II. III.
    if (/^###\s/.test(line) || /^(I{1,3}|IV|V|VI{0,3}|IX|X)\.\s/i.test(line)) {
      lines.push({ kind: 'part', text: stripMd(line) })
      continue
    }

    // Question line: starts with number and contains point hint
    const questionMatch = line.match(/^(\d+[\.\)])\s+(.+?)(?:\s*[\(\[]([\d,.]+\s*(?:pts?|points?|\/\d+))\s*[\)\]])?$/)
    if (questionMatch) {
      const qText = stripMd(`${questionMatch[1]} ${questionMatch[2]}`)
      const pts = questionMatch[3] ?? ''
      lines.push({ kind: 'question', text: qText, points: pts })
      continue
    }

    // Sub-question: a) b) c)
    if (/^[a-z]\)\s/i.test(line)) {
      lines.push({ kind: 'question', text: stripMd(line), points: '' })
      continue
    }

    // Instruction / consigne
    if (/^(consigne|barème|note|durée|nom|prénom|date|classe|matière)/i.test(line)) {
      lines.push({ kind: 'instruction', text: stripMd(line) })
      continue
    }

    lines.push({ kind: 'text', text: stripMd(line) })
  }

  return lines
}

// ── header block ─────────────────────────────────────────────────────────────

function drawHeader(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  meta: PdfMetadata,
  pageWidth: number,
  margin: number,
  startY: number
): number {
  const gray = rgb(0.3, 0.3, 0.3)
  const black = rgb(0, 0, 0)
  const lineH = 18
  let y = startY

  // Top rule
  page.drawRectangle({ x: margin, y: y + 4, width: pageWidth - margin * 2, height: 2, color: rgb(0.2, 0.2, 0.8) })
  y -= 24

  // School fields row
  const fields = [
    { label: 'Nom :', value: '' },
    { label: 'Prénom :', value: '' },
    { label: 'Niveau :', value: meta.niveau },
    { label: 'Date :', value: '' },
  ]
  const colW = (pageWidth - margin * 2) / 2
  fields.forEach((f, i) => {
    const x = margin + (i % 2) * colW
    const rowY = i < 2 ? y : y - lineH * 1.6
    page.drawText(f.label, { x, y: rowY, size: 9, font: bold, color: gray })
    const labelW = bold.widthOfTextAtSize(f.label, 9) + 4
    if (f.value) {
      page.drawText(f.value, { x: x + labelW, y: rowY, size: 9, font: regular, color: black })
    } else {
      page.drawLine({ start: { x: x + labelW, y: rowY - 1 }, end: { x: x + colW - 8, y: rowY - 1 }, thickness: 0.5, color: gray })
    }
  })
  y -= lineH * 3.5

  // Info band
  const dureeLabel = meta.duree === '30min' ? '30 minutes' : meta.duree === '1h' ? '1 heure' : meta.duree === '2h' ? '2 heures' : '3 heures'
  const notationLabel = meta.notation === '/20' ? '/ 20 points' : meta.notation === '/100' ? '/ 100 points' : 'Notation par lettres'
  const info = `Durée : ${dureeLabel}   •   Notation : ${notationLabel}`
  const infoW = regular.widthOfTextAtSize(info, 9)
  page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 20, color: rgb(0.93, 0.93, 1) })
  page.drawText(info, { x: margin + (pageWidth - margin * 2 - infoW) / 2, y: y + 3, size: 9, font: regular, color: rgb(0.2, 0.2, 0.6) })
  y -= 30

  // Bottom rule
  page.drawRectangle({ x: margin, y: y + 4, width: pageWidth - margin * 2, height: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 16

  return y
}

// ── page factory ─────────────────────────────────────────────────────────────

function addPage(doc: PDFDocument, bold: PDFFont, regular: PDFFont, meta: PdfMetadata): [PDFPage, number] {
  const page = doc.addPage([595, 842]) // A4
  const margin = 50
  const pageWidth = 595
  const startY = 810
  const y = drawHeader(page, bold, regular, meta, pageWidth, margin, startY)
  return [page, y]
}

// ── draw helpers ─────────────────────────────────────────────────────────────

function drawAnswerLines(page: PDFPage, x: number, y: number, width: number, lineCount: number, lineH: number): number {
  const gray = rgb(0.75, 0.75, 0.75)
  for (let i = 0; i < lineCount; i++) {
    const ly = y - i * lineH
    page.drawLine({ start: { x, y: ly }, end: { x: x + width, y: ly }, thickness: 0.4, color: gray })
  }
  return y - lineCount * lineH - 4
}

// ── main generator ───────────────────────────────────────────────────────────

export async function generateControlePdf(
  content: string,
  meta: PdfMetadata,
  fillable: boolean
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const margin = 50
  const pageWidth = 595
  const contentWidth = pageWidth - margin * 2
  const lineH = 18
  const minY = 60

  let [page, y] = addPage(doc, bold, regular, meta)

  const form = fillable ? doc.getForm() : null
  let fieldIdx = 0

  function ensureSpace(needed: number): void {
    if (y - needed < minY) {
      ;[page, y] = addPage(doc, bold, regular, meta)
    }
  }

  const parsed = parseContent(content)

  for (const line of parsed) {
    switch (line.kind) {
      case 'separator': {
        y -= 6
        break
      }

      case 'title': {
        ensureSpace(36)
        const wrapped = wrapText(line.text, bold, 14, contentWidth)
        for (const w of wrapped) {
          page.drawText(w, { x: margin, y, size: 14, font: bold, color: rgb(0.1, 0.1, 0.5) })
          y -= lineH + 2
        }
        y -= 4
        break
      }

      case 'part': {
        ensureSpace(30)
        y -= 4
        page.drawRectangle({ x: margin - 4, y: y - 2, width: contentWidth + 8, height: 18, color: rgb(0.93, 0.93, 1) })
        page.drawText(line.text, { x: margin, y, size: 11, font: bold, color: rgb(0.2, 0.2, 0.7) })
        y -= lineH + 6
        break
      }

      case 'question': {
        const answerLines = 3
        const needed = lineH * (2 + answerLines) + 20
        ensureSpace(needed)

        // Question text
        const qWrapped = wrapText(
          line.points ? `${line.text}  (${line.points})` : line.text,
          bold,
          10,
          contentWidth - 8
        )
        for (const w of qWrapped) {
          page.drawText(w, { x: margin + 4, y, size: 10, font: bold, color: rgb(0, 0, 0) })
          y -= lineH
        }
        y -= 4

        if (fillable && form) {
          // Interactive text field
          const fieldH = answerLines * lineH + 4
          const field = form.createTextField(`answer_${fieldIdx++}`)
          field.setText('')
          field.addToPage(page, {
            x: margin + 4,
            y: y - fieldH,
            width: contentWidth - 8,
            height: fieldH,
            textColor: rgb(0, 0, 0),
            backgroundColor: rgb(0.97, 0.97, 1),
            borderColor: rgb(0.7, 0.7, 0.85),
            borderWidth: 0.5,
          })
          field.enableMultiline()
          y -= fieldH + 10
        } else {
          y = drawAnswerLines(page, margin + 4, y, contentWidth - 8, answerLines, lineH)
          y -= 8
        }
        break
      }

      case 'instruction': {
        ensureSpace(lineH + 4)
        page.drawText(line.text, { x: margin, y, size: 9, font: regular, color: rgb(0.4, 0.4, 0.4) })
        y -= lineH
        break
      }

      case 'text': {
        if (!line.text) { y -= 6; break }
        const wrapped = wrapText(line.text, regular, 10, contentWidth)
        for (const w of wrapped) {
          ensureSpace(lineH)
          page.drawText(w, { x: margin, y, size: 10, font: regular, color: rgb(0.15, 0.15, 0.15) })
          y -= lineH
        }
        break
      }
    }
  }

  // Footer on last page
  const pageCount = doc.getPageCount()
  const lastPage = doc.getPage(pageCount - 1)
  lastPage.drawText('Bonne chance ! — Généré par Brio', {
    x: margin,
    y: 36,
    size: 8,
    font: regular,
    color: rgb(0.6, 0.6, 0.6),
  })
  lastPage.drawText(`Page ${pageCount}/${pageCount}`, {
    x: pageWidth - margin - 40,
    y: 36,
    size: 8,
    font: regular,
    color: rgb(0.6, 0.6, 0.6),
  })

  return doc.save()
}
