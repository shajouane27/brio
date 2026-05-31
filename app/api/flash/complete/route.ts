import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Jour courant au format YYYY-MM-DD, fuseau Europe/Paris
function parisDay(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { results } = await request.json() as { results: { id: string; correct: boolean }[] }
    const safe = Array.isArray(results) ? results : []

    // Mise à jour de la maîtrise + derniere_vue de chaque carte
    if (safe.length) {
      const ids = safe.map((r) => r.id)
      const { data: cards } = await supabase
        .from('flash_cards')
        .select('id, niveau_maitrise')
        .eq('user_id', user.id)
        .in('id', ids)

      const now = new Date().toISOString()
      const byId = new Map((cards ?? []).map((c) => [c.id, c.niveau_maitrise as number]))

      await Promise.all(safe.map((r) => {
        const cur = byId.get(r.id) ?? 0
        const next = Math.max(0, Math.min(5, cur + (r.correct ? 1 : -1)))
        return supabase
          .from('flash_cards')
          .update({ derniere_vue: now, niveau_maitrise: next })
          .eq('id', r.id)
          .eq('user_id', user.id)
      }))
    }

    // Mise à jour du streak quotidien
    const today = parisDay()
    const yesterday = parisDay(new Date(Date.now() - 86_400_000))

    const { data: profile } = await supabase
      .from('profiles')
      .select('flash_streak, flash_last_day')
      .eq('id', user.id)
      .single()

    const lastDay: string | null = profile?.flash_last_day ?? null
    const currentStreak: number = profile?.flash_streak ?? 0

    let newStreak = currentStreak
    if (lastDay !== today) {
      newStreak = lastDay === yesterday ? currentStreak + 1 : 1
      await supabase
        .from('profiles')
        .update({ flash_streak: newStreak, flash_last_day: today })
        .eq('id', user.id)
    }

    return NextResponse.json({ streak: newStreak })
  } catch (error) {
    console.error('Flash complete error:', error)
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
