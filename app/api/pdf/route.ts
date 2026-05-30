import { NextRequest, NextResponse } from 'next/server'
import { generateControlePdf } from '@/lib/pdf/generate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, fillable, meta } = body

    if (!content || !meta) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const pdfBytes = await generateControlePdf(content, meta, !!fillable)
    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
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
