import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import HistoriqueList from '@/components/dashboard/HistoriqueList'
import ProgressionChart from '@/components/dashboard/ProgressionChart'
import EnfantNiveauEditor from '@/components/dashboard/EnfantNiveauEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EnfantDashboardPage({ params }: Props) {
  const { id: childId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify the logged-in user is a parent of this child
  const { data: link } = await supabase
    .from('parent_child_links')
    .select('id')
    .eq('parent_id', user.id)
    .eq('child_id', childId)
    .single()

  if (!link) notFound()

  const [{ data: parentProfile }, { data: childProfile }, { data: controles }] = await Promise.all([
    supabase.from('profiles').select('prenom, profile_type').eq('id', user.id).single(),
    supabase.from('profiles').select('prenom, niveau').eq('id', childId).single(),
    supabase.from('controles').select('*').eq('user_id', childId).order('created_at', { ascending: false }),
  ])

  const parentPrenom = parentProfile?.prenom ?? 'Parent'
  const childPrenom = childProfile?.prenom ?? 'Élève'
  const childNiveau = childProfile?.niveau

  return (
    <div className="min-h-screen">
      <Navbar prenom={parentPrenom} profileType="parent" />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {childPrenom}
            </h1>
            {childNiveau && <p className="text-slate-500 mt-0.5">{childNiveau}</p>}
          </div>
        </div>

        {/* Niveau scolaire — modifiable par le parent */}
        <EnfantNiveauEditor
          childId={childId}
          childPrenom={childPrenom}
          currentNiveau={childNiveau ?? 'CP'}
        />

        {/* Progression */}
        <ProgressionChart controles={controles ?? []} />

        {/* History */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">📋 Contrôles corrigés</h2>
          <HistoriqueList controles={controles ?? []} readOnly />
        </div>
      </main>
    </div>
  )
}
