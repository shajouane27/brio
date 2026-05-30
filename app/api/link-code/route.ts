import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/link-code — student generates a code
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Delete previous codes for this user
  await supabase.from('link_codes').delete().eq('user_id', user.id)

  const code = generateCode()
  const { error } = await supabase.from('link_codes').insert({
    code,
    user_id: user.id,
  })

  if (error) return NextResponse.json({ error: 'Erreur génération code' }, { status: 500 })
  return NextResponse.json({ code })
}

// PATCH /api/link-code — parent submits a code to link a child
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { code } = await request.json()
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  // Find valid code
  const { data: linkCode, error: findError } = await supabase
    .from('link_codes')
    .select('user_id, expires_at')
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (findError || !linkCode) {
    return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 404 })
  }

  const childId = linkCode.user_id

  if (childId === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous lier à vous-même' }, { status: 400 })
  }

  // Check child is actually an élève
  const { data: childProfile } = await supabase
    .from('profiles')
    .select('prenom, profile_type, niveau')
    .eq('id', childId)
    .single()

  if (!childProfile || childProfile.profile_type !== 'eleve') {
    return NextResponse.json({ error: 'Ce code ne correspond pas à un compte élève' }, { status: 400 })
  }

  // Create link (ignore duplicate)
  await supabase.from('parent_child_links').upsert({ parent_id: user.id, child_id: childId })

  // Invalidate the code
  await supabase.from('link_codes').delete().eq('code', code)

  return NextResponse.json({ child: childProfile })
}
