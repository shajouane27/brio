import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectMatiere, normalizeNote } from '@/lib/matiere'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { controleContent, correction, notation, duree } = body

    if (!correction || !controleContent) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const matiere = detectMatiere(controleContent)
    const { sur20, max20 } = normalizeNote(correction.note_finale ?? '', notation ?? '/20')

    const { data, error } = await supabase.from('controles').insert({
      user_id: user.id,
      matiere,
      duree,
      notation,
      note_obtenue: correction.note_finale,
      note_sur_20: sur20,
      note_max: max20,
      contenu_controle: controleContent,
      correction,
    }).select('id').single()

    if (error) throw error
    return NextResponse.json({ id: data.id, matiere })
  } catch (error) {
    console.error('Save controle error:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }
}
