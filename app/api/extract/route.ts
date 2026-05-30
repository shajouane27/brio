import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ImageBlock = {
  type: 'image'
  source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 })
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images' }, { status: 400 })
    }

    // Build content blocks: interleave image + page label
    const contentBlocks: (ImageBlock | { type: 'text'; text: string })[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      // Anthropic Vision n'accepte que jpeg/png/gif/webp — on normalise les types non supportés (HEIC, etc.)
      const SUPPORTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      const rawType = file.type || 'image/jpeg'
      const mediaType = (SUPPORTED.includes(rawType) ? rawType : 'image/jpeg') as ImageBlock['source']['media_type']

      contentBlocks.push({ type: 'text', text: `--- Page ${i + 1} sur ${files.length} ---` })
      contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } })
    }

    const pageWord = files.length === 1 ? 'page' : 'pages'
    contentBlocks.push({
      type: 'text',
      text: `Tu es un assistant pédagogique expert du système éducatif français.
Tu viens de recevoir ${files.length} ${pageWord} d'un cours scolaire, dans l'ordre indiqué.

Ta mission : extraire et reconstituer le contenu complet du cours en une seule synthèse cohérente.

Instructions :
- Retranscris fidèlement le contenu de TOUTES les pages dans l'ordre
- Fusionne les idées qui se continuent d'une page à l'autre (ne découpe pas artificiellement par page)
- Conserve la structure logique globale : titre du cours, plan, définitions, formules, exemples
- Si une phrase commence sur une page et finit sur la suivante, reconstitue-la
- Si des formules mathématiques ou scientifiques sont présentes, transcris-les clairement
- Ne rajoute rien, ne reformule pas : extrais uniquement ce qui est écrit/visible

Réponds uniquement avec le contenu extrait, sans commentaire ni mention des numéros de pages.`,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: contentBlocks }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Extract error:', error)
    return NextResponse.json({ error: "Erreur lors de l'extraction" }, { status: 500 })
  }
}
