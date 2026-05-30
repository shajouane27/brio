import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

export default async function DashboardPage() {
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

  return (
    <div className="min-h-screen">
      <Navbar prenom={prenom} profileType={profileType} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Bonjour {prenom} ! 👋
          </h1>
          {niveau && (
            <p className="text-slate-500 mt-1">Niveau : {niveau}</p>
          )}
        </div>

        {profileType === 'eleve' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/upload"
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="font-semibold text-slate-900 mb-1">Analyser un cours</h2>
              <p className="text-sm text-slate-500">
                Prends en photo ton cours et génère des exercices ou un contrôle type.
              </p>
            </Link>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 opacity-60">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="font-semibold text-slate-900 mb-1">Mes résultats</h2>
              <p className="text-sm text-slate-500">
                Bientôt disponible
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-slate-600">
              Espace parent – Suivez les progrès de votre enfant. Fonctionnalité bientôt disponible.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
