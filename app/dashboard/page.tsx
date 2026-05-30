import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import HistoriqueList from '@/components/dashboard/HistoriqueList'
import ProgressionChart from '@/components/dashboard/ProgressionChart'
import ParentDashboard from '@/components/dashboard/ParentDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const prenom = profile?.prenom ?? user.user_metadata?.prenom ?? 'Utilisateur'
  const profileType = profile?.profile_type ?? user.user_metadata?.profile_type ?? 'eleve'
  const niveau = profile?.niveau ?? user.user_metadata?.niveau

  // ── PARENT dashboard ──────────────────────────────────────────────────────
  if (profileType === 'parent') {
    const { data: links } = await supabase
      .from('parent_child_links')
      .select('child_id')
      .eq('parent_id', user.id)

    const childIds = (links ?? []).map((l) => l.child_id)

    let children: {
      id: string
      prenom: string
      niveau: string
      controles_count: number
      derniere_note: string | null
      derniere_matiere: string | null
    }[] = []

    if (childIds.length) {
      const { data: childProfiles } = await supabase
        .from('profiles')
        .select('id, prenom, niveau')
        .in('id', childIds)

      children = await Promise.all(
        (childProfiles ?? []).map(async (cp) => {
          const { data: controles } = await supabase
            .from('controles')
            .select('note_obtenue, matiere')
            .eq('user_id', cp.id)
            .order('created_at', { ascending: false })

          return {
            id: cp.id,
            prenom: cp.prenom ?? '?',
            niveau: cp.niveau ?? '?',
            controles_count: controles?.length ?? 0,
            derniere_note: controles?.[0]?.note_obtenue ?? null,
            derniere_matiere: controles?.[0]?.matiere ?? null,
          }
        })
      )
    }

    return (
      <div className="min-h-screen">
        <Navbar prenom={prenom} profileType={profileType} />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Bonjour {prenom} 👋</h1>
            <p className="text-slate-500 mt-1">Espace parent — suivi de vos enfants</p>
          </div>
          <ParentDashboard children={children} />
        </main>
      </div>
    )
  }

  // ── ÉLÈVE dashboard ───────────────────────────────────────────────────────
  const { data: controles } = await supabase
    .from('controles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allControles = controles ?? []

  return (
    <div className="min-h-screen">
      <Navbar prenom={prenom} profileType={profileType} />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bonjour {prenom} ! 👋</h1>
            {niveau && <p className="text-slate-500 mt-0.5">{niveau}</p>}
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <span>📸</span> Analyser un cours
          </Link>
        </div>

        {/* Progression chart */}
        <ProgressionChart controles={allControles} />

        {/* History */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">📋 Mes contrôles corrigés</h2>
          <HistoriqueList controles={allControles} />
        </div>

        {/* Paramètres link */}
        <div className="pt-2 border-t border-slate-200">
          <Link href="/parametres" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ⚙️ Paramètres · Lier mon compte à un parent
          </Link>
        </div>
      </main>
    </div>
  )
}
