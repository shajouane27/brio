import { NextRequest, NextResponse } from 'next/server'
import { generateControlePdf, generateFichePdf } from '@/lib/pdf/generate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, fillable, meta, type } = body

    if (!content) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Fiche de révision — rendu propre et imprimable
    if (type === 'fiche') {
      const pdfBytes = await generateFichePdf(content, { niveau: meta?.niveau ?? '' })
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="brio-fiche-revision.pdf"',
        },
      })
    }

    // Contrôle (par défaut)
    if (!meta) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const pdfBytes = await generateControlePdf(content, meta, !!fillable)
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="brio-controle${fillable ? '-interactif' : ''}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
