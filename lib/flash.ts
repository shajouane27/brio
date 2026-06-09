import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from './model'
import { getCountryConfig } from './countries'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface FlashCard {
  type: 'qcm' | 'vraifaux'
  question: string
  options: string[]
  reponse: string
}

// Génère 10 questions flash (QCM / vrai-faux) à partir du contenu d'un cours.
export async function generateFlashCards(contenu: string, niveau: string, pays = 'fr-FR'): Promise<FlashCard[]> {
  const countryConfig = getCountryConfig(pays)
  const langue = countryConfig.langue_generation   // ex. "français" ou "português europeu"

  // Pour le vrai/faux, les options sont dans la langue du profil
  const vraiLabel = pays === 'pt-PT' ? 'Verdadeiro' : 'Vrai'
  const fauxLabel = pays === 'pt-PT' ? 'Falso'      : 'Faux'

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `Tu es un professeur expert. À partir de ce cours (niveau ${niveau || 'lycée'}), crée 10 questions flash de révision, répondables en moins de 30 secondes chacune.
UNIQUEMENT des QCM (3 ou 4 choix) ou des Vrai/Faux.

LANGUE OBLIGATOIRE : génère TOUTES les questions et réponses en ${langue}. Ne mélange pas les langues.
Pour les questions Vrai/Faux : "options" = ["${vraiLabel}","${fauxLabel}"].

Réponds STRICTEMENT en JSON valide : un tableau de 10 objets, rien d'autre (pas de texte autour, pas de balises markdown).
Chaque objet : {"type":"qcm"|"vraifaux","question":"...","options":["...","..."],"reponse":"..."}
- "reponse" doit être EXACTEMENT égale à l'une des "options".
- Questions claires, variées, qui couvrent les notions importantes du cours.

COURS :
${contenu.slice(0, 6000)}`,
      }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonStr = raw.replace(/```json\s*|\s*```/g, '').trim()
    const start = jsonStr.indexOf('[')
    const end = jsonStr.lastIndexOf(']')
    if (start === -1 || end === -1) return []
    const parsed = JSON.parse(jsonStr.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((c) =>
        c && typeof c.question === 'string' &&
        Array.isArray(c.options) && c.options.length >= 2 &&
        typeof c.reponse === 'string' && c.options.includes(c.reponse)
      )
      .slice(0, 10)
      .map((c) => ({
        type: c.type === 'vraifaux' ? 'vraifaux' : 'qcm',
        question: String(c.question),
        options: c.options.map((o: unknown) => String(o)),
        reponse: String(c.reponse),
      }))
  } catch (e) {
    console.error('Flash generation error:', e)
    return []
  }
}
