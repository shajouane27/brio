import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NIVEAUX } from '@/lib/niveaux'

/**
 * PATCH /api/update-niveau
 *
 * Élève modifie son propre niveau :
 *   body: { niveau: "CM1" }
 *
 * Parent modifie le niveau d'un enfant :
 *   body: { childId: "uuid", niveau: "CM1" }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { niveau, childId } = body as { niveau: string; childId?: string }

  // Valider le niveau
  if (!NIVEAUX.includes(niveau as typeof NIVEAUX[number])) {
    return NextResponse.json({ error: 'Niveau invalide' }, { status: 400 })
  }

  const targetId = childId ?? user.id

  // Si c'est un enfant, vérifier le lien parent–enfant
  if (childId && childId !== user.id) {
    const { data: link } = await supabase
      .from('parent_child_links')
      .select('id')
      .eq('parent_id', user.id)
      .eq('child_id', childId)
      .single()

    if (!link) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ niveau, updated_at: new Date().toISOString() })
    .eq('id', targetId)

  if (error) {
    console.error('update-niveau error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, niveau })
}
