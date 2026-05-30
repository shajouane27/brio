import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'

export const maxDuration = 60
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const controleContent = formData.get('controleContent') as string | null
    const notation = formData.get('notation') as string | null
    const niveau = formData.get('niveau') as string | null

    if (!file || !controleContent) {
      return NextResponse.json({ error: 'Image et contenu du contrôle requis' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    const notationLabel =
      notation === '/20' ? 'sur 20 points' :
      notation === '/100' ? 'sur 100 points' :
      'par lettres (A=excellent, B=bien, C=assez bien, D=passable, E=insuffisant)'

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Tu es un professeur bienveillant et expert du système éducatif français pour le niveau ${niveau ?? 'lycée'}.

Voici le SUJET DU CONTRÔLE que l'élève a passé :
---
${controleContent}
---

Tu viens de recevoir la photo de la COPIE DE L'ÉLÈVE (visible dans l'image).

Ta mission : corriger cette copie de façon détaillée et pédagogique.

INSTRUCTIONS DE CORRECTION :
1. Identifie chaque question du sujet (dans l'ordre)
2. Pour chaque question, lis la réponse de l'élève visible sur la copie
3. Évalue la réponse avec le barème du sujet (notation ${notationLabel})
4. Donne un retour pédagogique court (max 2 phrases)

FORMAT DE RÉPONSE (JSON strict, sans markdown) :
{
  "note_finale": "XX/20" ou "XX/100" ou "B+",
  "appreciation": "Appréciation globale en 1-2 phrases",
  "questions": [
    {
      "numero": "1",
      "enonce_court": "Début de la question (max 60 car.)",
      "reponse_eleve": "Ce que l'élève a écrit (résumé si long)",
      "points_obtenus": "X",
      "points_max": "Y",
      "correct": true,
      "bon_element": "Ce qui est juste dans la réponse",
      "a_ameliorer": "Ce qui manque ou est incorrect (vide si correct)",
      "commentaire_peda": "Commentaire pédagogique bref"
    }
  ]
}

Si une question n'a pas de réponse visible, indique reponse_eleve: "Sans réponse" et points_obtenus: "0".
Sois encourageant et constructif dans tes commentaires.`,
            },
          ],
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from the response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Format de réponse inattendu' }, { status: 500 })
    }

    const correction = JSON.parse(jsonMatch[0])
    return NextResponse.json({ correction })
  } catch (error) {
    console.error('Correction error:', error)
    return NextResponse.json({ error: 'Erreur lors de la correction' }, { status: 500 })
  }
}
