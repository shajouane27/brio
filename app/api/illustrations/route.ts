import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'
import { detectMatiere } from '@/lib/matiere'

export const maxDuration = 30
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Matières pour lesquelles on cherche des illustrations
const VISUAL_MATIERES = ['Histoire-Géographie', 'Histoire', 'Géographie', 'SVT', 'Physique-Chimie']

interface Concept { page: string; legende: string }
interface Illustration {
  legende: string
  imageUrl: string
  sourceUrl: string
  sourceTitle: string
}

export async function POST(request: NextRequest) {
  try {
    const { courseText, niveau } = await request.json()
    if (!courseText || typeof courseText !== 'string') {
      return NextResponse.json({ images: [], matiere: null })
    }

    const matiere = detectMatiere(courseText)
    if (!VISUAL_MATIERES.includes(matiere)) {
      return NextResponse.json({ images: [], matiere })
    }

    // 1) Concepts visuels clés via Claude (titres de pages Wikipédia anglaises)
    let concepts: Concept[] = []
    try {
      const msg = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Cours de ${matiere} (niveau ${niveau || 'collège'}). Identifie 2 à 3 concepts visuels clés que l'on peut illustrer par une image.
Pour chacun, donne le TITRE EXACT de la page Wikipédia ANGLAISE la plus pertinente (pour trouver une image libre) et une courte légende en français.
Réponds UNIQUEMENT en JSON : [{"page":"Photosynthesis","legende":"La photosynthèse"}]

COURS :
${courseText.slice(0, 3000)}`,
        }],
      })
      const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
      const s = raw.indexOf('['), e = raw.lastIndexOf(']')
      if (s !== -1 && e !== -1) {
        const parsed = JSON.parse(raw.slice(s, e + 1))
        if (Array.isArray(parsed)) concepts = parsed.filter((c) => c?.page).slice(0, 3)
      }
    } catch { /* pas de concepts */ }

    // 2) Image Wikimedia via l'API REST de résumé Wikipédia
    const images: Illustration[] = []
    for (const c of concepts) {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(c.page)}`,
          { headers: { 'User-Agent': 'BrioApp/1.0 (educational app)', accept: 'application/json' } }
        )
        if (!res.ok) continue
        const j = await res.json()
        const img: string | undefined = j.thumbnail?.source
        if (!img) continue // pas de placeholder vide si pas d'image
        images.push({
          legende: c.legende || j.title || c.page,
          imageUrl: img,
          sourceUrl: j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(c.page)}`,
          sourceTitle: j.title || c.page,
        })
      } catch { /* on ignore ce concept */ }
    }

    return NextResponse.json({ images, matiere })
  } catch (error) {
    console.error('Illustrations error:', error)
    return NextResponse.json({ images: [], matiere: null })
  }
}
