import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'

// Vision sur plusieurs pages peut dépasser 10s — on autorise jusqu'à 60s
// (sinon Vercel coupe la fonction et l'extraction échoue).
export const maxDuration = 60
export const runtime = 'nodejs'

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
    const SUPPORTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = await file.arrayBuffer()

      // Anthropic Vision limite chaque image à ~5 Mo
      if (bytes.byteLength > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `La page ${i + 1} est trop lourde (max 5 Mo). Reprends la photo de plus loin.` },
          { status: 400 }
        )
      }

      const base64 = Buffer.from(bytes).toString('base64')
      // Anthropic Vision n'accepte que jpeg/png/gif/webp — on normalise les types non supportés (HEIC, etc.)
      const rawType = (file.type || '').toLowerCase()
      const mediaType = (SUPPORTED.includes(rawType) ? rawType : 'image/jpeg') as ImageBlock['source']['media_type']

      contentBlocks.push({ type: 'text', text: `--- Page ${i + 1} sur ${files.length} ---` })
      contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } })
    }

    const pageWord = files.length === 1 ? 'page' : 'pages'
    contentBlocks.push({
      type: 'text',
      text: `Tu es un assistant pédagogique.
Tu viens de recevoir ${files.length} ${pageWord} d'un cours scolaire, dans l'ordre indiqué.

Ta mission : extraire et reconstituer le contenu complet du cours en une seule synthèse cohérente.

Instructions :
- Retranscris fidèlement le contenu de TOUTES les pages dans l'ordre
- Fusionne les idées qui se continuent d'une page à l'autre
- Conserve la structure logique globale : titre du cours, plan, définitions, formules, exemples
- Si une phrase commence sur une page et finit sur la suivante, reconstitue-la
- Si des formules mathématiques ou scientifiques sont présentes, transcris-les clairement
- Ne rajoute rien, ne reformule pas : extrais uniquement ce qui est écrit/visible
- TRÈS IMPORTANT : conserve la langue du cours (français, portugais, anglais…) — retranscris dans la même langue, ne traduis pas.

À la TOUTE FIN de ta réponse, ajoute une seule ligne au format exact : LANG:XX (ex: LANG:fr ou LANG:pt) pour indiquer la langue du cours détectée.

Réponds avec le contenu extrait, puis la ligne LANG:XX.`,
    })

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: contentBlocks }],
    })

    let text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    // Extrait le code langue (LANG:xx) et le retire du texte affiché
    let detectedLang: string | null = null
    text = text.replace(/\s*LANG:([a-z]{2})\s*$/im, (_, lang) => {
      detectedLang = lang.toLowerCase()
      return ''
    }).trimEnd()
    return NextResponse.json({ text, detectedLang })
  } catch (error) {
    console.error('Extract error:', error)
    // Remonte le vrai message (erreur API Anthropic, clé manquante, format refusé…)
    const detail =
      error instanceof Anthropic.APIError
        ? `${error.status ?? ''} ${error.message}`.trim()
        : error instanceof Error
        ? error.message
        : 'inconnue'
    return NextResponse.json(
      { error: `Erreur lors de l'extraction : ${detail}` },
      { status: 500 }
    )
  }
}
