import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import CoursList, { type Cours } from '@/components/CoursList'
import { t, langFromPays } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default async function CoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('prenom, profile_type, pays')
    .eq('id', user.id)
    .single()

  const prenom = profile?.prenom ?? user.user_metadata?.prenom ?? 'Élève'
  const profileType = profile?.profile_type ?? user.user_metadata?.profile_type ?? 'eleve'
  const pays = (profile as { pays?: string } | null)?.pays ?? 'fr-FR'
  const lang = langFromPays(pays)

  const { data: cours } = await supabase
    .from('cours')
    .select('id, titre, matiere, niveau, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Navbar prenom={prenom} profileType={profileType} pays={pays} />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">←</Link>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>📚</span> {t('mes_cours_titre', lang)}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {t('sous_titre_cours', lang)}
              </p>
            </div>
          </div>
        </div>

        <CoursList cours={(cours ?? []) as Cours[]} />
      </main>
    </div>
  )
}
