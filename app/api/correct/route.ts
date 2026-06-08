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

Ta mission : corriger cette copie en suivant CETTE MÉTHODE pour CHAQUE question.

1. Détecte le type de réponse :
   - Réponse UNIQUE (QCM, vrai/faux) → corrige globalement.
   - Réponse MULTIPLE (conjugaison, texte à trous, liste, "entoure") → corrige ÉLÉMENT PAR ÉLÉMENT.
   - Réponse RÉDIGÉE (phrase, paragraphe) → évalue le SENS global et attribue un statut (voir règles ci-dessous).

2. Pour les réponses MULTIPLES : décompose (par ligne, virgule, tiret, numéro), corrige chaque élément (✓ ou ✗), et calcule les points PARTIELS proportionnellement (ex : 4 bons sur 6 = 4/6 × barème ; points_obtenus peut être décimal).

3. Pour les réponses RÉDIGÉES — RÈGLE DU STATUT (champ "statut") :
   - "correct"   : réponse complète, juste, contient les éléments clés attendus → points_obtenus = 100 % du barème
   - "partiel"   : réponse incomplète ou partiellement juste (éléments manquants ou imprécis) → points_obtenus = 50 % du barème
   - "incorrect" : réponse fausse ou hors sujet → points_obtenus = 0
   - "vide"      : aucune réponse, blanc, "je ne sais pas" → points_obtenus = 0
   NE JAMAIS valider une réponse vide ou "je ne sais pas" comme "correct" ou "partiel".
   Pour les autres types (QCM, multiple…) : statut = "correct" si correct=true, "partiel" si points partiels > 0, "incorrect" si 0 point sans réponse vide, "vide" si aucune réponse.

4. Pour CHAQUE erreur, fournis TOUJOURS : la bonne réponse, l'explication de la règle adaptée au niveau ${niveau ?? 'lycée'}, et un exemple concret pour mémoriser.

5. Note finale = somme des points partiels, barème détaillé question par question, en notation ${notationLabel}.

FORMAT DE RÉPONSE (JSON strict, sans markdown) :
{
  "note_finale": "XX/20" ou "XX/100" ou "B+",
  "appreciation": "Appréciation globale en 1-2 phrases",
  "questions": [
    {
      "numero": "1",
      "type": "conjugaison|qcm|vrai_faux|redaction|texte_a_trous|liste|calcul|autre",
      "statut": "correct|partiel|incorrect|vide",
      "enonce_court": "Début de la question (max 60 car.)",
      "reponse_eleve": "Ce que l'élève a écrit (résumé si long)",
      "elements": [
        { "attendu": "Je suis", "reponse": "Je suis", "correct": true, "points": 0.33, "explication": "" },
        { "attendu": "Tu es", "reponse": "Tu est", "correct": false, "points": 0, "explication": "On écrit « es » (verbe être)." }
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
- Réponse MULTIPLE (conjugaison, texte à trous, liste, entoure) : un objet par élément attendu, avec "attendu", "reponse" (ce qu'a écrit l'élève), "correct", "points" partiels, "explication" si faux.
- Réponse UNIQUE (QCM, vrai/faux) : un seul élément.
- Réponse RÉDIGÉE : "elements" peut être [] (sens global via statut + points_obtenus + pourquoi).
- "points_obtenus" = somme des "points". "pourquoi"/"exemple" uniquement en cas d'erreur ou statut partiel.
Si une question n'a pas de réponse visible : reponse_eleve "Sans réponse", statut "vide", points_obtenus 0, elements [].`,
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
