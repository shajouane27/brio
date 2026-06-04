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
    const { controleContent, notation, niveau, answers, copieLibre } = body as {
      controleContent: string
      notation: string
      niveau: string
      answers?: AnswerItem[]
      copieLibre?: string
    }

    const hasAnswers = Array.isArray(answers) && answers.length > 0
    const hasCopieLibre = typeof copieLibre === 'string' && copieLibre.trim().length > 0
    if (!controleContent || (!hasAnswers && !hasCopieLibre)) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const notationLabel =
      notation === '/20' ? 'sur 20 points' :
      notation === '/100' ? 'sur 100 points' :
      'par lettres (A=excellent, B=bien, C=assez bien, D=passable, E=insuffisant)'

    const copie = hasAnswers
      ? answers!
          .map((a) => `Question ${a.numero}${a.bareme ? ` (${a.bareme})` : ''} : ${a.question}\nRéponse de l'élève : ${a.reponse?.trim() ? a.reponse.trim() : 'Sans réponse'}`)
          .join('\n\n')
      : `Réponses dictées à l'oral par l'élève (transcription) :\n${copieLibre!.trim()}`

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

Corrige cette copie (notation ${notationLabel}) en suivant CETTE MÉTHODE pour CHAQUE question :

1. Détecte le type de réponse :
   - Réponse UNIQUE (QCM, vrai/faux) → corrige globalement (juste ou faux).
   - Réponse MULTIPLE (conjugaison, texte à trous, liste, "entoure") → corrige ÉLÉMENT PAR ÉLÉMENT.
   - Réponse RÉDIGÉE (phrase, paragraphe) → évalue le SENS global.

2. Pour les réponses MULTIPLES : décompose la réponse (par ligne, virgule, tiret ou numéro), corrige chaque élément (✓ ou ✗), et calcule les points PARTIELS proportionnellement.
   Exemple : 4 bons éléments sur 6 attendus = 4/6 × le barème de la question (points_obtenus peut être décimal).

3. Pour CHAQUE erreur (élément faux ou réponse fausse), fournis TOUJOURS :
   - la bonne réponse,
   - l'explication de la règle en langage adapté au niveau ${niveau ?? 'lycée'},
   - un exemple concret pour mémoriser.

4. Note finale = somme de tous les points partiels. Détaille le barème question par question. Note globale en notation ${notationLabel}.

FORMAT DE RÉPONSE (JSON strict, sans markdown) :
{
  "note_finale": "XX/20" ou "XX/100" ou "B+",
  "appreciation": "Appréciation globale en 1-2 phrases",
  "questions": [
    {
      "numero": "1",
      "type": "conjugaison|qcm|vrai_faux|redaction|texte_a_trous|liste|calcul|autre",
      "enonce_court": "Début de la question (max 60 car.)",
      "reponse_eleve": "Réponse de l'élève (résumé si long)",
      "elements": [
        { "attendu": "Je suis", "reponse": "Je suis", "correct": true, "points": 0.33, "explication": "" },
        { "attendu": "Tu es", "reponse": "Tu est", "correct": false, "points": 0, "explication": "On écrit « es » (verbe être), pas « est »." }
      ],
      "points_obtenus": 0.33,
      "points_max": 2,
      "correct": false,
      "pourquoi": "Explication globale de la règle, adaptée au niveau",
      "exemple": "Un exemple concret pour mémoriser"
    }
  ]
}

Règles pour "elements" :
- Réponse MULTIPLE (conjugaison, texte à trous, liste, entoure) : un objet par élément attendu, avec "attendu", "reponse" (ce qu'a écrit l'élève), "correct", "points" (partiels), et "explication" si faux.
- Réponse UNIQUE (QCM, vrai/faux) : un seul élément.
- Réponse RÉDIGÉE : "elements" peut être [] et tu évalues le sens global via points_obtenus + pourquoi.
- "points_obtenus" = somme des "points" des éléments. "pourquoi" et "exemple" ne sont remplis qu'en cas d'erreur.
Si une réponse est vide : reponse_eleve "Sans réponse", points_obtenus 0, elements [].`,
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
