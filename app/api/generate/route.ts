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

À partir du cours suivant, génère 5 exercices variés et progressifs (facile → difficile), adaptés au niveau ${niveau || 'lycée'}.

COURS :
${courseText}

Réponds STRICTEMENT en JSON valide, rien d'autre (pas de texte autour, pas de balises markdown).
Format : {"exercices":[ ... ]}
Chaque exercice est un objet :
{
  "type": "qcm" | "vraifaux" | "ouverte",
  "question": "énoncé clair de la question",
  "options": ["...", "..."],          // UNIQUEMENT pour qcm (3-4 choix) et vraifaux (["Vrai","Faux"]) ; [] pour ouverte
  "reponse": "la bonne réponse",        // pour qcm/vraifaux : EXACTEMENT l'une des options ; pour ouverte : la réponse attendue concise
  "explication": "explication courte et claire adaptée au niveau, qui dit POURQUOI c'est la bonne réponse et quelle notion/règle s'applique",
  "exemple": "un exemple concret et mémorisable",
  "astuce": "une astuce mémo si pertinent, sinon chaîne vide"
}

RÈGLES :
- Mélange les types : au moins 2 QCM, 1 vrai/faux, 1-2 questions ouvertes courtes.
- Les explications, exemples et astuces doivent être pédagogiques et adaptés au niveau ${niveau || 'lycée'}.
- N'écris JAMAIS la réponse dans le champ "question".`

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

N'inclus PAS d'en-tête Nom/Prénom/Date/Note : il est ajouté automatiquement. Commence directement par le titre.

Tu dois DÉTECTER le type de chaque question et appliquer le format EXACT correspondant ci-dessous. Réponds en texte/Markdown, UNE SEULE chose par ligne.

STRUCTURE GÉNÉRALE :
- Première ligne : le titre, en niveau 1 : "# Contrôle de [Matière] — Durée : ${dureeLabel}"
- Puis une consigne courte en italique sur sa propre ligne (ex : *Lis bien chaque question.*).
- Parties en chiffres romains, en niveau 2 : "## I. [Titre de la partie] (… points)".
- Sous-questions numérotées (1., 2., 3.), chacune sur SA PROPRE LIGNE, avec son barème à la fin : "(2 pts)".

FORMATS PAR TYPE DE QUESTION (à choisir selon la question) :

• QCM — une option par ligne, commençant par une case à cocher :
□ A. Réponse A
□ B. Réponse B
□ C. Réponse C
□ D. Réponse D

• TEXTE À TROUS — une phrase par ligne, JAMAIS deux trous sur la même ligne, le trou en pointillés :
La photosynthèse permet aux plantes de produire de la ..................
grâce à la lumière du ..................

• CONJUGAISON — UNE personne par ligne, obligatoirement :
Je    .................................................................
Tu    .................................................................
Il / Elle  .................................................................
Nous  .................................................................
Vous  .................................................................
Ils / Elles .................................................................

• CALCUL / PHYSIQUE / CHIMIE — étapes structurées, chacune avec son espace :
Données :
.................................................................
Formule utilisée :
.................................................................
Application numérique :
.................................................................
Résultat :
.................................................................

• RÉDACTION / DÉVELOPPEMENT — plusieurs lignes de pointillés (minimum 8 lignes pour le lycée, 4 pour le primaire), chacune sur sa propre ligne.

• TABLEAU À COMPLÉTER — un vrai tableau Markdown avec des cellules vides à remplir :
| Colonne 1 | Colonne 2 | Colonne 3 |
|---|---|---|
|  |  |  |
|  |  |  |

• SCHÉMA / GRAPHIQUE — une étiquette puis un grand cadre vide :
[ Espace réservé au schéma — à réaliser sur cette feuille ]
┌─────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘

RÈGLES GLOBALES OBLIGATOIRES :
- Une question par ligne minimum ; une réponse par ligne — JAMAIS deux réponses côte à côte.
- Une LIGNE VIDE entre chaque question.
- Barème visible après chaque question.
- Le total des points correspond EXACTEMENT à la notation (${notationLabel}).
- Titre centré, parties en chiffres romains, sous-questions numérotées.
- Aucun émoji, pas de gras inutile, aucune introduction ni commentaire.

ADAPTATION AU NIVEAU (${niveau || 'lycée'}) :
- CP à CM2 : phrases courtes, beaucoup d'espace, maximum 10 questions.
- 6ème à 3ème : format collège standard, 3 parties maximum, durée respectée (${dureeLabel}).
- 2nde à Terminale : format lycée complet, questions longues, calculs avec étapes, rédactions développées.

ADAPTATION À LA MATIÈRE (détecte-la depuis le cours) :
- Français : conjugaison, dictée, rédaction, questions de compréhension.
- Maths : calculs avec étapes, problèmes, géométrie avec espace de schéma.
- Physique-Chimie : données, formules, application numérique, unités obligatoires.
- Histoire-Géo : questions de cours, analyse de document, rédaction.
- SVT : schémas légendés, QCM, questions de cours.
- Langues vivantes : traduction, texte à trous, compréhension, rédaction.`
    }

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: type === 'controle' ? 8000 : 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Exercices : on renvoie un JSON structuré (réponses séparées des questions)
    if (type === 'exercices') {
      const exercices = parseExercices(text)
      if (!exercices.length) {
        return NextResponse.json({ error: 'Génération des exercices impossible. Réessaie.' }, { status: 502 })
      }
      return NextResponse.json({ exercices })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}

interface Exercice {
  type: 'qcm' | 'vraifaux' | 'ouverte'
  question: string
  options: string[]
  reponse: string
  explication: string
  exemple: string
  astuce: string
}

function parseExercices(raw: string): Exercice[] {
  try {
    const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) return []
    const obj = JSON.parse(cleaned.slice(start, end + 1))
    const list = Array.isArray(obj?.exercices) ? obj.exercices : []
    return list
      .filter((e: unknown): e is Record<string, unknown> =>
        !!e && typeof (e as Record<string, unknown>).question === 'string')
      .map((e: Record<string, unknown>) => {
        const type = e.type === 'vraifaux' ? 'vraifaux' : e.type === 'ouverte' ? 'ouverte' : 'qcm'
        const options = Array.isArray(e.options) ? e.options.map((o) => String(o)) : []
        return {
          type,
          question: String(e.question),
          options: type === 'vraifaux' && options.length < 2 ? ['Vrai', 'Faux'] : options,
          reponse: String(e.reponse ?? ''),
          explication: String(e.explication ?? ''),
          exemple: String(e.exemple ?? ''),
          astuce: String(e.astuce ?? ''),
        } as Exercice
      })
      .slice(0, 8)
  } catch {
    return []
  }
}
