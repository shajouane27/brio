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

/**
 * Rend le texte encodable par les polices standard (WinAnsi).
 * pdf-lib plante sur les caractères hors WinAnsi (→, ≤, ≠, π, exposants…).
 * On mappe les symboles courants vers de l'ASCII, puis on retire le reste.
 */
function sanitizePdfText(s: string): string {
  return s
    .replace(/[‘’‚‛]/g, "'")        // guillemets simples courbes
    .replace(/[“”„‟]/g, '"')        // guillemets doubles courbes
    .replace(/[–—―]/g, '-')              // tirets longs
    .replace(/…/g, '...')                          // points de suspension
    .replace(/[     ]/g, ' ')  // espaces insécables/fines
    .replace(/[•●◦⁃∙]/g, '-')  // puces
    .replace(/[→⇒➜➡➔]/g, '->') // flèches droite
    .replace(/[←⇐]/g, '<-')                   // flèches gauche
    .replace(/↔/g, '<->')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/±/g, '+/-')
    .replace(/[−]/g, '-')                          // signe moins maths
    .replace(/[×⋅∗]/g, 'x')              // multiplication
    .replace(/÷/g, '/')                            // division
    .replace(/[√]/g, 'racine')                     // racine carrée
    .replace(/π/g, 'pi')
    // Retire tout ce qui n'est pas ASCII imprimable ou Latin-1 (WinAnsi-safe)
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, '')
}

/** Strip light markdown: **bold**, *italic*, leading #/- */
function stripMd(text: string): string {
  return sanitizePdfText(
    text
      .replace(/^\s*#{1,6}\s*/, '')
      .replace(/^\s*[-*]\s+/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .trim()
  )
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

    // Cadre de schéma (caractères de dessin) → ligne vide
    if (/[┌┐└┘├┤┬┴┼│─]/.test(line)) {
      lines.push({ kind: 'text', text: '' })
      continue
    }

    // Tableau Markdown → texte en colonnes (les cellules vides deviennent un espace à remplir)
    if (/^\|.*\|$/.test(line)) {
      if (/^\|[\s:|-]+\|$/.test(line)) { lines.push({ kind: 'separator' }); continue }
      const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => stripMd(c.trim()) || '____')
      lines.push({ kind: 'text', text: cells.join('      ') })
      continue
    }

    // Case à cocher (QCM)
    const cbMatch = line.match(/^(?:□|☐|◻|\[\s?\]|-\s*\[\s?\])\s*(.*)$/)
    if (cbMatch) {
      lines.push({ kind: 'text', text: '[  ]  ' + stripMd(cbMatch[1]) })
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
  const lineH = 21
  const minY = 60

  void fillable // version interactive supprimée : on génère toujours la version imprimable

  // Les schémas SVG ne sont pas imprimables en texte : on les retire du PDF
  content = content.replace(/<svg[\s\S]*?<\/svg>/gi, '').replace(/```(?:svg|xml|html)?\s*```/gi, '')

  let [page, y] = addPage(doc, bold, regular, meta)

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
        ensureSpace(40)
        const wrapped = wrapText(line.text, bold, 16, contentWidth)
        for (const w of wrapped) {
          const tw = bold.widthOfTextAtSize(w, 16)
          page.drawText(w, { x: margin + (contentWidth - tw) / 2, y, size: 16, font: bold, color: rgb(0.1, 0.1, 0.5) })
          y -= lineH + 2
        }
        y -= 8
        break
      }

      case 'part': {
        ensureSpace(34)
        y -= 10
        const tw = bold.widthOfTextAtSize(line.text, 13)
        page.drawText(line.text, { x: margin + Math.max(0, (contentWidth - tw) / 2), y, size: 13, font: bold, color: rgb(0.2, 0.2, 0.7) })
        y -= 8
        page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: rgb(0.8, 0.8, 0.9) })
        y -= 16
        break
      }

      case 'question': {
        // Les espaces de réponse (pointillés) sont fournis par le contenu lui-même,
        // donc on dessine seulement l'énoncé, lisiblement, sans lignes auto.
        ensureSpace(lineH * 2)
        y -= 4
        const qWrapped = wrapText(
          line.points ? `${line.text}  (${line.points})` : line.text,
          bold,
          12,
          contentWidth - 4
        )
        for (const w of qWrapped) {
          page.drawText(w, { x: margin + 4, y, size: 12, font: bold, color: rgb(0, 0, 0) })
          y -= lineH
        }
        break
      }

      case 'instruction': {
        ensureSpace(lineH + 4)
        page.drawText(line.text, { x: margin, y, size: 11, font: regular, color: rgb(0.4, 0.4, 0.4) })
        y -= lineH
        break
      }

      case 'text': {
        if (!line.text) { y -= 6; break }
        const wrapped = wrapText(line.text, regular, 12, contentWidth)
        for (const w of wrapped) {
          ensureSpace(lineH)
          page.drawText(w, { x: margin, y, size: 12, font: regular, color: rgb(0.15, 0.15, 0.15) })
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

// ── Fiche de révision (rendu propre, imprimable) ──────────────────────────────

export async function generateFichePdf(
  content: string,
  meta: { niveau: string }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  const margin = 50
  const pageWidth = 595
  const pageHeight = 842
  const contentWidth = pageWidth - margin * 2
  const minY = 60

  const brand = rgb(0.39, 0.4, 0.95)
  const dark = rgb(0.1, 0.1, 0.2)
  const gray = rgb(0.35, 0.35, 0.4)

  // Retire les schémas SVG (non imprimables en texte)
  content = content.replace(/<svg[\s\S]*?<\/svg>/gi, '').replace(/```(?:svg|xml|html)?\s*```/gi, '')

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - 50

  function newPage() { page = doc.addPage([pageWidth, pageHeight]); y = pageHeight - 50 }
  function ensure(n: number) { if (y - n < minY) newPage() }

  // En-tête
  page.drawText('FICHE DE RÉVISION', { x: margin, y, size: 9, font: bold, color: brand })
  if (meta.niveau) {
    const w = regular.widthOfTextAtSize(meta.niveau, 9)
    page.drawText(meta.niveau, { x: pageWidth - margin - w, y, size: 9, font: regular, color: gray })
  }
  y -= 10
  page.drawRectangle({ x: margin, y, width: contentWidth, height: 2, color: brand })
  y -= 24

  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line || line === '---') { y -= 6; continue }

    // Titre #
    if (/^#\s/.test(line)) {
      ensure(30)
      for (const w of wrapText(stripMd(line), bold, 18, contentWidth)) {
        page.drawText(w, { x: margin, y, size: 18, font: bold, color: dark }); y -= 24
      }
      y -= 6
      continue
    }

    // Section ##
    if (/^#{2,3}\s/.test(line)) {
      ensure(28)
      y -= 4
      page.drawText(stripMd(line), { x: margin, y, size: 13, font: bold, color: brand })
      y -= 14
      page.drawRectangle({ x: margin, y: y + 4, width: contentWidth, height: 0.6, color: rgb(0.85, 0.86, 0.98) })
      y -= 12
      continue
    }

    // Citation > (encadré "À retenir")
    if (/^>\s?/.test(line)) {
      const text = stripMd(line.replace(/^>\s?/, ''))
      const wrapped = wrapText(text, bold, 10.5, contentWidth - 24)
      const boxH = wrapped.length * 16 + 12
      ensure(boxH + 6)
      page.drawRectangle({ x: margin, y: y - boxH + 14, width: contentWidth, height: boxH, color: rgb(0.95, 0.96, 1) })
      page.drawRectangle({ x: margin, y: y - boxH + 14, width: 4, height: boxH, color: brand })
      let ly = y
      for (const w of wrapped) {
        page.drawText(w, { x: margin + 14, y: ly, size: 10.5, font: bold, color: rgb(0.2, 0.2, 0.5) }); ly -= 16
      }
      y -= boxH + 6
      continue
    }

    // Puce
    if (/^[-*]\s+/.test(line)) {
      const rest = line.replace(/^[-*]\s+/, '')
      const def = rest.match(/^\*\*(.+?)\*\*\s*:?\s*(.*)$/)
      ensure(18)
      page.drawCircle({ x: margin + 4, y: y + 3, size: 1.6, color: brand })
      if (def) {
        const term = stripMd(def[1].trim())
        const definition = stripMd(def[2].trim())
        const termLabel = definition ? `${term} : ` : term
        page.drawText(termLabel, { x: margin + 14, y, size: 10, font: bold, color: dark })
        const termW = bold.widthOfTextAtSize(termLabel, 10)
        if (definition) {
          const defWrapped = wrapText(definition, regular, 10, contentWidth - 16 - termW)
          page.drawText(defWrapped[0] ?? '', { x: margin + 14 + termW, y, size: 10, font: regular, color: gray }); y -= 16
          for (let i = 1; i < defWrapped.length; i++) { ensure(16); page.drawText(defWrapped[i], { x: margin + 14, y, size: 10, font: regular, color: gray }); y -= 16 }
        } else { y -= 16 }
        y -= 2
      } else {
        for (const w of wrapText(stripMd(rest), regular, 10, contentWidth - 16)) {
          ensure(16); page.drawText(w, { x: margin + 14, y, size: 10, font: regular, color: rgb(0.15, 0.15, 0.2) }); y -= 16
        }
        y -= 2
      }
      continue
    }

    // Texte normal
    for (const w of wrapText(stripMd(line), regular, 10, contentWidth)) {
      ensure(16); page.drawText(w, { x: margin, y, size: 10, font: regular, color: rgb(0.15, 0.15, 0.2) }); y -= 16
    }
    y -= 2
  }

  const last = doc.getPage(doc.getPageCount() - 1)
  last.drawText('Fiche de révision — Généré par Brio', { x: margin, y: 36, size: 8, font: regular, color: rgb(0.6, 0.6, 0.6) })

  return doc.save()
}
