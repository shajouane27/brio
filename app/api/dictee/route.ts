import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'

export const maxDuration = 30
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function longueurPour(niveau: string): string {
  const n = niveau || ''
  if (n.includes('CP')) return 'très court : 1 à 2 phrases simples (environ 15 mots)'
  if (n.includes('CE1') || n.includes('CE2')) return 'court : 2 à 3 phrases (environ 30 mots)'
  return 'environ 4 à 5 phrases (50 à 80 mots)'
}

export async function POST(request: NextRequest) {
  try {
    const { courseText, niveau } = await request.json()
    if (!courseText) {
      return NextResponse.json({ error: 'Cours manquant' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Tu es professeur des écoles. Rédige un TEXTE DE DICTÉE ORIGINAL pour un élève de niveau ${niveau || 'CM1'}.

Le texte ne doit PAS recopier le cours : c'est un texte nouveau, mais qui réutilise le même vocabulaire et les mêmes notions grammaticales/orthographiques que le cours ci-dessous.
Longueur : ${longueurPour(niveau || 'CM1')}.
Phrases simples et claires, adaptées à l'âge. Ponctuation correcte.

Réponds UNIQUEMENT par le texte de la dictée, sans titre, sans guillemets, sans consigne.

COURS DE RÉFÉRENCE :
${courseText.slice(0, 3000)}`,
      }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
    if (!text) return NextResponse.json({ error: 'Génération impossible' }, { status: 502 })
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Dictee error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération de la dictée' }, { status: 500 })
  }
}
