import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'

export const maxDuration = 60
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface AnswerItem { numero: string; question: string; bareme: string; reponse: string }

// Corrige une copie REMPLIE DANS L'APP (réponses saisies au clavier).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { controleContent, notation, niveau, answers } = body as {
      controleContent: string
      notation: string
      niveau: string
      answers: AnswerItem[]
    }

    if (!controleContent || !Array.isArray(answers) || !answers.length) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const notationLabel =
      notation === '/20' ? 'sur 20 points' :
      notation === '/100' ? 'sur 100 points' :
      'par lettres (A=excellent, B=bien, C=assez bien, D=passable, E=insuffisant)'

    const copie = answers
      .map((a) => `Question ${a.numero}${a.bareme ? ` (${a.bareme})` : ''} : ${a.question}\nRéponse de l'élève : ${a.reponse?.trim() ? a.reponse.trim() : 'Sans réponse'}`)
      .join('\n\n')

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Tu es un professeur bienveillant et expert du système éducatif français pour le niveau ${niveau ?? 'lycée'}.

Voici le SUJET DU CONTRÔLE :
---
${controleContent}
---

Voici les RÉPONSES DE L'ÉLÈVE (saisies au clavier) :
---
${copie}
---

Corrige cette copie question par question (notation ${notationLabel}). Sois précis, encourageant et pédagogique : en cas d'erreur, explique brièvement la bonne réponse.

FORMAT DE RÉPONSE (JSON strict, sans markdown) :
{
  "note_finale": "XX/20" ou "XX/100" ou "B+",
  "appreciation": "Appréciation globale en 1-2 phrases",
  "questions": [
    {
      "numero": "1",
      "enonce_court": "Début de la question (max 60 car.)",
      "reponse_eleve": "Réponse de l'élève (résumé si long)",
      "points_obtenus": "X",
      "points_max": "Y",
      "correct": true,
      "bon_element": "Ce qui est juste",
      "a_ameliorer": "Ce qui manque ou est incorrect (vide si correct)",
      "commentaire_peda": "Explication pédagogique brève, avec la bonne réponse en cas d'erreur"
    }
  ]
}

Si une réponse est vide, mets reponse_eleve: "Sans réponse" et points_obtenus: "0".`,
      }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Format de réponse inattendu' }, { status: 500 })
    }

    const correction = JSON.parse(jsonMatch[0])
    return NextResponse.json({ correction })
  } catch (error) {
    console.error('Correct-copie error:', error)
    return NextResponse.json({ error: 'Erreur lors de la correction' }, { status: 500 })
  }
}
