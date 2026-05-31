import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { detectMatiere } from '@/lib/matiere'
import { CLAUDE_MODEL } from '@/lib/model'

export const maxDuration = 60
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface FlashCard {
  type: 'qcm' | 'vraifaux'
  question: string
  options: string[]
  reponse: string
}

// Génère 10 questions flash (QCM / vrai-faux) à partir du cours.
async function generateFlashCards(contenu: string, niveau: string): Promise<FlashCard[]> {
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `À partir de ce cours (niveau ${niveau || 'lycée'}), crée 10 questions flash de révision, répondables en moins de 30 secondes chacune.
UNIQUEMENT des QCM (3 ou 4 choix) ou des Vrai/Faux.

Réponds STRICTEMENT en JSON valide : un tableau de 10 objets, rien d'autre (pas de texte autour, pas de balises markdown).
Chaque objet : {"type":"qcm"|"vraifaux","question":"...","options":["...","..."],"reponse":"..."}
- Pour vraifaux : "options" = ["Vrai","Faux"].
- "reponse" doit être EXACTEMENT égale à l'une des "options".
- Questions claires, variées, qui couvrent les notions importantes du cours.

COURS :
${contenu.slice(0, 6000)}`,
      }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonStr = raw.replace(/```json\s*|\s*```/g, '').trim()
    const start = jsonStr.indexOf('[')
    const end = jsonStr.lastIndexOf(']')
    if (start === -1 || end === -1) return []
    const parsed = JSON.parse(jsonStr.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((c) =>
        c && typeof c.question === 'string' &&
        Array.isArray(c.options) && c.options.length >= 2 &&
        typeof c.reponse === 'string' && c.options.includes(c.reponse)
      )
      .slice(0, 10)
      .map((c) => ({
        type: c.type === 'vraifaux' ? 'vraifaux' : 'qcm',
        question: String(c.question),
        options: c.options.map((o: unknown) => String(o)),
        reponse: String(c.reponse),
      }))
  } catch (e) {
    console.error('Flash generation error:', e)
    return []
  }
}

// Détecte un titre court via Claude. En cas d'échec, repli sur la 1re ligne.
async function detectTitre(contenu: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 40,
      messages: [{
        role: 'user',
        content: `Voici le début d'un cours scolaire. Donne-lui un titre court et clair (5 mots maximum), sans guillemets ni ponctuation finale. Réponds UNIQUEMENT par le titre.\n\n${contenu.slice(0, 1500)}`,
      }],
    })
    const txt = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
    if (txt) return txt.replace(/^["«»]+|["«».]+$/g, '').slice(0, 120)
  } catch {
    // repli ci-dessous
  }
  const firstLine = contenu.split('\n').map((l) => l.replace(/^#+\s*/, '').trim()).find((l) => l.length > 0)
  return (firstLine ?? 'Cours sans titre').slice(0, 120)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { contenu, niveau } = await request.json()
    if (!contenu || typeof contenu !== 'string') {
      return NextResponse.json({ error: 'Contenu manquant' }, { status: 400 })
    }

    const matiere = detectMatiere(contenu)
    const titre = await detectTitre(contenu)

    const { data, error } = await supabase.from('cours').insert({
      user_id: user.id,
      titre,
      matiere,
      niveau: niveau ?? null,
      contenu,
    }).select('id').single()

    if (error) throw error

    // Génère 10 questions flash et les rattache au cours (best-effort)
    const cards = await generateFlashCards(contenu, niveau ?? '')
    if (cards.length) {
      await supabase.from('flash_cards').insert(
        cards.map((c) => ({
          user_id: user.id,
          cours_id: data.id,
          type: c.type,
          question: c.question,
          options: c.options,
          reponse: c.reponse,
        }))
      )
    }

    return NextResponse.json({ id: data.id, titre, matiere, flashCount: cards.length })
  } catch (error) {
    console.error('Save cours error:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde du cours' }, { status: 500 })
  }
}

// PATCH — enregistre la fiche de révision générée sur le cours correspondant.
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id, fiche } = await request.json()
    if (!id || typeof fiche !== 'string') {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cours')
      .update({ fiche })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Save fiche error:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde de la fiche' }, { status: 500 })
  }
}
