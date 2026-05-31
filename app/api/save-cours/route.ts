import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { detectMatiere } from '@/lib/matiere'
import { CLAUDE_MODEL } from '@/lib/model'

export const maxDuration = 30
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
    return NextResponse.json({ id: data.id, titre, matiere })
  } catch (error) {
    console.error('Save cours error:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde du cours' }, { status: 500 })
  }
}
