import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/model'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCountryConfig, isPrimaire, isCollege } from '@/lib/countries'

export const maxDuration = 60
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Enregistre les questions générées dans l'historique du cours.
async function storeQuestions(
  supabase: SupabaseClient | null,
  userId: string | null,
  coursId: string | undefined,
  type: string,
  questions: string[]
): Promise<void> {
  if (!supabase || !userId || !coursId || !questions.length) return
  try {
    await supabase.from('questions_posees').insert(
      questions.slice(0, 40).map((q) => ({
        user_id: userId,
        cours_id: coursId,
        type,
        question: q.slice(0, 500),
      }))
    )
  } catch (e) {
    console.error('storeQuestions error:', e)
  }
}

// Extrait le texte des questions d'un sujet de contrôle (pour l'historique).
function extractControleQuestions(md: string): string[] {
  const out: string[] = []
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    const m = line.match(/^(\d+)[.)]\s+(.+)$/)
    if (m && !/(?:\.{6,}|…{2,}|_{6,})/.test(line)) {
      const txt = m[2].replace(/\(\s*\d+\s*(?:pts?|points?)\s*\)\s*$/i, '').trim()
      if (txt) out.push(txt)
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, duree, notation, coursId, harder, pays, detectedLang } = body
    let { courseText, niveau } = body

    // Config pays (utilisé pour formater les prompts)
    const countryConfig = getCountryConfig(pays || (detectedLang === 'pt' ? 'pt-PT' : null))
    const langue = countryConfig.langue_generation
    const formatPeda = countryConfig.format_pedagogique.trim()
    const trad = countryConfig.tradition_litteraire

    // Niveau scolaire pour les règles de texte support
    const niveauStr = niveau || 'lycée'
    const niveauCategorie = isPrimaire(niveauStr, countryConfig) ? 'primaire'
      : isCollege(niveauStr, countryConfig) ? 'college'
      : 'lycee'
    const tradNiveau = niveauCategorie === 'primaire' ? trad.auteurs_primaire
      : niveauCategorie === 'college' ? trad.auteurs_college
      : trad.auteurs_lycee

    // Réutilisation d'un cours sauvegardé : on récupère le contenu + l'historique
    let supabase: SupabaseClient | null = null
    let userId: string | null = null
    let previousQuestions: string[] = []

    if (coursId) {
      supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        const { data: cours } = await supabase
          .from('cours').select('contenu, niveau').eq('id', coursId).single()
        if (cours) {
          courseText = cours.contenu
          niveau = niveau || cours.niveau
        }
        const { data: qs } = await supabase
          .from('questions_posees')
          .select('question')
          .eq('cours_id', coursId).eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(80)
        previousQuestions = (qs ?? []).map((q) => q.question as string)
      }
    }

    if (!type || !courseText) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    let prompt = ''

    if (type === 'exercices') {
      prompt = `Tu es un professeur expert pour le niveau ${niveau || 'lycée'}.

CONTEXTE PÉDAGOGIQUE :
${formatPeda}

Réponds UNIQUEMENT en ${langue}.
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
      prompt = `Tu es un professeur pour le niveau ${niveau || 'lycée'}.

CONTEXTE PÉDAGOGIQUE :
${formatPeda}

Rédige UNIQUEMENT en ${langue} une FICHE DE RÉVISION synthétique, lisible en 5 minutes maximum.

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

SCHÉMA (si pertinent) : Si le cours contient des circuits électriques, des molécules, des figures géométriques ou des schémas scientifiques, génère le SVG correspondant en code (une balise <svg>…</svg> autonome, avec un viewBox défini, sans largeur/hauteur fixes en pixels pour rester responsive). Le SVG sera rendu directement dans l'app.

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

      prompt = `Tu es un professeur pour le niveau ${niveau || 'lycée'}.

CONTEXTE PÉDAGOGIQUE :
${formatPeda}

Rédige UNIQUEMENT en ${langue} un sujet de contrôle : sobre, professionnel, sans émojis, sans gras inutile.

COURS :
${courseText}

PARAMÈTRES :
- Durée : ${dureeLabel}
- Notation : ${notationLabel}
- Niveau : ${niveau || 'lycée'}

N'inclus PAS d'en-tête : il est ajouté automatiquement. Commence directement par le titre.

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

SCHÉMA (si pertinent) : Si une question porte sur un circuit électrique, une molécule, une figure géométrique ou un schéma scientifique, génère le SVG correspondant en code (une balise <svg>…</svg> autonome avec un viewBox défini, sans largeur/hauteur fixes en pixels). Il sera rendu directement dans l'app.

── TEXTE SUPPORT (langue et littérature) ─────────────────────────────────────

DÉTECTION AUTOMATIQUE : Si le cours porte sur l'une de ces notions (dans TOUTE langue) —
${trad.mots_cles_litterature.trim()}
— alors tu DOIS générer un texte support AVANT les questions.

Si le cours NE porte PAS sur ces notions (maths, sciences, histoire-géo, etc.) → N'inclus AUCUN texte support.

QUAND GÉNÉRER : Place le texte support IMMÉDIATEMENT après le titre et la consigne générale, et AVANT la première partie (Groupe I / Partie I / etc.).

FORMAT EXACT DU TEXTE SUPPORT (ne modifie pas les séparateurs ─ ni les emojis) :
📖 ${trad.instruction_lecture.split(' ').slice(0, 3).join(' ').toUpperCase()}
─────────────────────────────────────────────────────
[Titre du texte entre guillemets ou sans titre]
[Texte généré ICI dans la langue du cours — jamais en français pour un cours en portugais]
─────────────────────────────────────────────────────
⚠️ ${trad.instruction_lecture}

RÈGLES DE GÉNÉRATION DU TEXTE :
${tradNiveau.trim()}
${trad.tradition_poetique ? `\nTRADITION POÉTIQUE (si le cours porte sur la poésie) :\n${trad.tradition_poetique.trim()}` : ''}

TYPE DE TEXTE selon le cours :
- Cours sur la poésie → poème original dans la tradition poétique du pays, adapté au niveau
- Cours sur le roman / narrative → extrait narratif dans le style local
- Cours sur le théâtre → dialogue théâtral
- Cours sur la grammaire appliquée → texte qui illustre la notion grammaticale étudiée
- Cours sur la nouvelle → nouvelle courte
- Cours sur l'essai / argumentation → texte argumentatif ou extrait d'essai

RÈGLE ABSOLUE : Le texte support, son titre, et l'instruction de lecture (⚠️) sont TOUJOURS dans la langue du cours. Si le cours est en portugais, tout est en portugais. Si en anglais, tout est en anglais. JAMAIS de mélange de langues.

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

    // Historique : ne jamais reposer les mêmes questions + difficulté progressive
    if (type === 'exercices' || type === 'controle') {
      if (previousQuestions.length) {
        prompt += `\n\n--- QUESTIONS DÉJÀ POSÉES À CET ÉLÈVE SUR CE COURS ---
Ne reprends AUCUNE de ces questions, même reformulée :
${previousQuestions.map((q) => `- ${q}`).join('\n')}

Génère des questions DIFFÉRENTES de celles-ci, sur les MÊMES notions mais avec des angles et des formulations différents.`
      }
      if (harder) {
        prompt += `\n\nL'élève a bien réussi la session précédente (plus de 70 %) : augmente LÉGÈREMENT la difficulté (questions un peu plus exigeantes), sans changer de niveau scolaire.`
      }
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
      await storeQuestions(supabase, userId, coursId, type, exercices.map((e) => e.question))
      return NextResponse.json({ exercices })
    }

    if (type === 'controle') {
      await storeQuestions(supabase, userId, coursId, type, extractControleQuestions(text))
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
