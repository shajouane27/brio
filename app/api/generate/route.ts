import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, courseText, niveau, duree, notation } = body

    if (!type || !courseText) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    let prompt = ''

    if (type === 'exercices') {
      prompt = `Tu es un professeur expert du système éducatif français pour le niveau ${niveau || 'lycée'}.

À partir du cours suivant, génère une série d'exercices variés et progressifs adaptés au niveau ${niveau || 'lycée'}.

COURS :
${courseText}

CONSIGNES :
- Crée entre 4 et 6 exercices de difficulté progressive (facile → difficile)
- Varie les types : QCM, questions ouvertes, exercices d'application, mise en situation
- Chaque exercice doit avoir un titre et des consignes claires
- Adapte le vocabulaire et la complexité au niveau ${niveau || 'lycée'}
- Numérote les exercices (Exercice 1, Exercice 2, etc.)
- Pour les QCM, propose 4 réponses possibles

Format de réponse en Markdown bien structuré.`

    } else if (type === 'controle') {
      const dureeLabel = duree === '30min' ? '30 minutes' :
                         duree === '1h' ? '1 heure' :
                         duree === '2h' ? '2 heures' : '3 heures'

      const notationLabel = notation === '/20' ? 'noté sur 20 points' :
                            notation === '/100' ? 'noté sur 100 points' :
                            'noté par lettres (A, B, C, D, E)'

      prompt = `Tu es un professeur expert du système éducatif français pour le niveau ${niveau || 'lycée'}.

À partir du cours suivant, génère un contrôle type conforme aux standards de l'Éducation Nationale française.

COURS :
${courseText}

PARAMÈTRES DU CONTRÔLE :
- Durée : ${dureeLabel}
- Notation : ${notationLabel}
- Niveau : ${niveau || 'lycée'}

CONSIGNES DE MISE EN FORME (respecte impérativement le format de l'Éducation Nationale) :
1. En-tête avec : Matière, Niveau, Durée, Date (à compléter), Nom/Prénom (à compléter)
2. Barème détaillé avec points attribués à chaque question/partie
3. Structure en parties numérotées (I., II., III.) avec sous-questions
4. Questions allant du plus simple au plus complexe
5. Mention "Bonne chance !" ou formule d'encouragement à la fin
6. Le total des points doit correspondre exactement au système de notation choisi
7. Adapte la durée au nombre et à la complexité des questions

Format de réponse en Markdown bien structuré, comme un vrai sujet de contrôle.`
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
