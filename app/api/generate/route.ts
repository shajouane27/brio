import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'

export const maxDuration = 60
export const runtime = 'nodejs'

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

    } else if (type === 'fiche') {
      prompt = `Tu es un professeur du système éducatif français pour le niveau ${niveau || 'lycée'}.

À partir du cours suivant, rédige une FICHE DE RÉVISION synthétique, lisible en 5 minutes maximum.

COURS :
${courseText}

Réponds UNIQUEMENT en Markdown, en respectant EXACTEMENT cette structure (utilise ces titres précis) :

# [Titre de la leçon]

## Points clés
Liste à puces de 5 à 7 notions essentielles à retenir. Chaque puce est COURTE (une ligne).

## Définitions importantes
Les termes clés, chacun en gras suivi de sa définition en une seule ligne. Exemple :
- **Terme** : définition courte et claire.

## À retenir absolument
2 à 3 règles ou formules incontournables. Mets CHACUNE sur une ligne de citation (commence la ligne par "> ") pour qu'elle soit encadrée.

## Exemples
2 à 3 exemples concrets et faciles à mémoriser, en puces.

## Astuce mémoire
Un seul moyen mnémotechnique ou une astuce simple pour retenir l'essentiel.

RÈGLES :
- Reste synthétique : on doit pouvoir lire la fiche en 5 minutes.
- Pas d'émojis. Markdown propre (titres ##, puces -, gras ** pour les termes).
- Adapte le vocabulaire au niveau ${niveau || 'lycée'}.
- Commence directement par le titre, sans phrase d'introduction.`

    } else if (type === 'controle') {
      const dureeLabel = duree === '30min' ? '30 minutes' :
                         duree === '1h' ? '1 heure' :
                         duree === '2h' ? '2 heures' : '3 heures'

      const notationLabel = notation === '/20' ? 'noté sur 20 points' :
                            notation === '/100' ? 'noté sur 100 points' :
                            'noté par lettres (A, B, C, D, E)'

      prompt = `Tu es un professeur du système éducatif français pour le niveau ${niveau || 'lycée'}.

À partir du cours suivant, rédige un sujet de contrôle qui ressemble EXACTEMENT à un vrai contrôle d'école française : sobre, professionnel, sans émojis, sans gras inutile.

COURS :
${courseText}

PARAMÈTRES :
- Durée : ${dureeLabel}
- Notation : ${notationLabel}
- Niveau : ${niveau || 'lycée'}

Réponds UNIQUEMENT en Markdown, en respectant SCRUPULEUSEMENT ce gabarit :

1. EN-TÊTE — un tableau Markdown avec l'identité de l'élève et la note à droite :

| Nom / Prénom | Classe | Date | Note |
|---|---|---|---|
| ........................ | .......... | .......... | ........ ${notation === '/100' ? '/ 100' : notation === 'lettres' ? '' : '/ 20'} |

2. TITRE — un titre de niveau 1 centré avec la matière et la durée, par exemple :
# Contrôle de [Matière] — Durée : ${dureeLabel}

3. CONSIGNE courte en italique sous le titre (matériel autorisé, soin, etc.).

4. PARTIES — numérotées en chiffres romains, en titre de niveau 2, avec le total de points de la partie entre parenthèses :
## I. [Titre de la partie] (... points)

5. SOUS-QUESTIONS — une liste numérotée (1., 2., 3.). Chaque question se termine par son barème entre parenthèses, ex : (2 pts). Sous CHAQUE question, laisse des lignes de réponse en pointillés (indentées de 3 espaces pour rester dans la question) :

1. Énoncé de la question. (2 pts)
   ............................................................
   ............................................................

2. Énoncé suivant. (4 pts)
   ............................................................

RÈGLES IMPORTANTES :
- Le total des points doit correspondre EXACTEMENT à la notation (${notationLabel}).
- 2 à 4 parties (I, II, III…), de la plus simple à la plus complexe.
- Adapte la quantité de questions à la durée (${dureeLabel}).
- Aucun émoji. Pas de mise en gras des énoncés. Reste sobre et scolaire.
- Ne mets ni introduction ni commentaire avant ou après le sujet : commence directement par le tableau d'en-tête.`
    }

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
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
