import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { COUNTRIES } from '@/lib/countries'

/**
 * PATCH /api/update-pays
 *
 * Élève modifie son propre pays :
 *   body: { pays: "pt-PT" }
 *
 * Parent modifie le pays d'un enfant :
 *   body: { childId: "uuid", pays: "pt-PT" }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { pays, childId } = body as { pays: string; childId?: string }

  // Valider le pays
  if (!COUNTRIES.find((c) => c.pays_id === pays)) {
    return NextResponse.json({ error: 'Pays invalide' }, { status: 400 })
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
    .update({ pays, updated_at: new Date().toISOString() })
    .eq('id', targetId)

  if (error) {
    console.error('update-pays error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  // Sync aussi les métadonnées utilisateur pour que le middleware puisse lire
  // le pays sans requête DB et mettre à jour le cookie brio_lang immédiatement.
  if (targetId === user.id) {
    await supabase.auth.updateUser({ data: { pays } })
  }

  return NextResponse.json({ ok: true, pays })
}
