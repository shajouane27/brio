import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFlashCards } from '@/lib/flash'

export const maxDuration = 60
export const runtime = 'nodejs'

const BATCH = 4 // nombre de cours traités par appel (limite de temps serverless)

// GET /api/flash/backfill
// Génère les questions flash pour les cours déjà existants qui n'en ont pas.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Pays du profil (pour générer les questions dans la bonne langue)
  const { data: profile } = await supabase
    .from('profiles')
    .select('pays')
    .eq('id', user.id)
    .single()
  const pays: string = profile?.pays ?? 'fr-FR'

  // Cours de l'élève
  const { data: cours } = await supabase
    .from('cours')
    .select('id, contenu, niveau')
    .eq('user_id', user.id)

  // Cours qui ont déjà des questions
  const { data: existing } = await supabase
    .from('flash_cards')
    .select('cours_id')
    .eq('user_id', user.id)

  const withCards = new Set((existing ?? []).map((e) => e.cours_id))
  const missing = (cours ?? []).filter((c) => !withCards.has(c.id))

  let traites = 0
  let questions = 0
  for (const c of missing.slice(0, BATCH)) {
    const cards = await generateFlashCards(c.contenu, c.niveau ?? '', pays)
    if (cards.length) {
      await supabase.from('flash_cards').insert(
        cards.map((card) => ({
          user_id: user.id,
          cours_id: c.id,
          type: card.type,
          question: card.question,
          options: card.options,
          reponse: card.reponse,
        }))
      )
      traites++
      questions += cards.length
    }
  }

  const restants = Math.max(0, missing.length - BATCH)
  return NextResponse.json({
    coursSansQuestions: missing.length,
    traitesMaintenant: traites,
    questionsGenerees: questions,
    restants,
    message: restants > 0
      ? `Encore ${restants} cours à traiter — recharge cette page pour continuer.`
      : 'Tous tes cours ont maintenant leurs questions flash !',
  })
}
