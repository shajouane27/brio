import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'
import { detectMatiere } from '@/lib/matiere'
import { searchWikimedia, type WikimediaResult, type VisualType } from '@/services/wikimedia'

export const maxDuration = 30
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Matières pour lesquelles on cherche des illustrations
const VISUAL_MATIERES = [
  'Histoire-Géographie', 'Histoire', 'Géographie',
  'SVT', 'Physique-Chimie',
  'Arts plastiques', 'Histoire des arts', 'Art',
]

interface ConceptIA {
  terme_recherche: string   // en anglais pour meilleur rappel sur Wikipedia
  terme_local?: string      // dans la langue du cours (pour la légende)
  type: VisualType
  pertinence: string
}

export interface IllustrationResult extends WikimediaResult {
  legende: string
  pertinence: string
}

// Déduit le code langue Wikipedia depuis le detectedLang du cours
function wikiLang(detectedLang?: string | null): string {
  if (!detectedLang) return 'en'
  const map: Record<string, string> = {
    fr: 'fr', pt: 'pt', en: 'en', es: 'es', de: 'de',
    it: 'it', ar: 'ar', zh: 'zh', ru: 'ru', ja: 'ja',
  }
  return map[detectedLang.toLowerCase().slice(0, 2)] ?? 'en'
}

export async function POST(request: NextRequest) {
  try {
    const { courseText, niveau, detectedLang } = await request.json()
    if (!courseText || typeof courseText !== 'string') {
      return NextResponse.json({ images: [], matiere: null })
    }

    const matiere = detectMatiere(courseText)
    if (!VISUAL_MATIERES.includes(matiere)) {
      return NextResponse.json({ images: [], matiere })
    }

    const lang = wikiLang(detectedLang)

    // ── 1) Identification des concepts visuels par Claude ─────────────────────
    let concepts: ConceptIA[] = []
    try {
      const msg = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Matière : ${matiere}. Niveau : ${niveau || 'collège'}.

Identifie 2 à 3 concepts de ce cours qui BÉNÉFICIERAIENT D'UNE ILLUSTRATION VISUELLE.

Critères d'inclusion :
- Histoire-Géo : cartes de régions/pays/batailles, portraits de personnages historiques
- SVT : schémas (cellule, corps humain, cycle), animaux, plantes, roches
- Physique-Chimie : molécules, circuits, phénomènes physiques
- Géographie : reliefs, fleuves, villes, climogrammes
- Arts : œuvres, artistes, mouvements artistiques

Critères d'EXCLUSION (ne rien mettre) : maths pures, conjugaison, orthographe, grammaire.

Réponds UNIQUEMENT en JSON valide :
[
  {
    "terme_recherche": "Photosynthesis",
    "terme_local": "photosynthèse",
    "type": "schema",
    "pertinence": "Ce schéma illustre le processus de transformation"
  }
]
Types possibles : "schema" | "carte" | "photo" | "portrait"

COURS :
${courseText.slice(0, 3000)}`,
        }],
      })
      const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
      const s = raw.indexOf('['), e = raw.lastIndexOf(']')
      if (s !== -1 && e !== -1) {
        const parsed = JSON.parse(raw.slice(s, e + 1))
        if (Array.isArray(parsed)) {
          concepts = parsed
            .filter((c) => typeof c?.terme_recherche === 'string')
            .slice(0, 3)
        }
      }
    } catch { /* pas de concepts — on continue */ }

    // ── 2) Recherche Wikimedia en parallèle (multilingue + fallback) ──────────
    const results = await Promise.all(
      concepts.map(async (c): Promise<IllustrationResult | null> => {
        const wiki = await searchWikimedia(c.terme_recherche, lang, c.type)
        if (!wiki) return null
        return {
          ...wiki,
          legende: c.terme_local || wiki.title,
          pertinence: c.pertinence || '',
        }
      })
    )

    const images = results.filter((r): r is IllustrationResult => r !== null)
    return NextResponse.json({ images, matiere })
  } catch (error) {
    console.error('Illustrations error:', error)
    return NextResponse.json({ images: [], matiere: null })
  }
}
