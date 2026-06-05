import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import LinkCodeGenerator from '@/components/dashboard/LinkCodeGenerator'
import NiveauEditor from '@/components/NiveauEditor'
import PaysEditor from '@/components/PaysEditor'
import { NIVEAUX } from '@/lib/niveaux'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const prenom = profile?.prenom ?? user.user_metadata?.prenom ?? 'Élève'
  const profileType = profile?.profile_type ?? user.user_metadata?.profile_type ?? 'eleve'
  const niveau = profile?.niveau ?? user.user_metadata?.niveau
  const pays = profile?.pays ?? 'fr-FR'

  if (profileType !== 'eleve') redirect('/dashboard')

  return (
    <div className="min-h-screen">
      <Navbar prenom={prenom} profileType={profileType} pays={pays} />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        </div>

        {/* Profile info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold text-slate-900">Mon profil</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400">Prénom</span>
              <p className="font-medium text-slate-900 mt-0.5">{prenom}</p>
            </div>
            <div>
              <span className="text-slate-400">Niveau</span>
              <p className="font-medium text-slate-900 mt-0.5">{niveau ?? '—'}</p>
            </div>
            <div>
              <span className="text-slate-400">Email</span>
              <p className="font-medium text-slate-900 mt-0.5">{user.email}</p>
            </div>
            <div>
              <span className="text-slate-400">Profil</span>
              <p className="font-medium text-slate-900 mt-0.5 capitalize">{profileType}</p>
            </div>
          </div>
        </div>

        {/* Niveau scolaire */}
        <NiveauEditor currentNiveau={niveau ?? NIVEAUX[0]} />

        {/* Pays */}
        <PaysEditor currentPays={pays} />

        {/* Link code generator */}
        <LinkCodeGenerator />
      </main>
    </div>
  )
}
