import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import UploadClient from './UploadClient'

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ coursId?: string; action?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const prenom = profile?.prenom ?? user.user_metadata?.prenom ?? 'Élève'
  const niveau = profile?.niveau ?? user.user_metadata?.niveau ?? 'Lycée'
  const profileType = profile?.profile_type ?? user.user_metadata?.profile_type ?? 'eleve'
  const pays = profile?.pays ?? 'fr-FR'

  // Réutilisation d'un cours sauvegardé (RLS garantit que c'est bien le sien)
  const { coursId, action } = await searchParams
  let initialCourseText: string | undefined
  if (coursId) {
    const { data: cours } = await supabase
      .from('cours')
      .select('contenu')
      .eq('id', coursId)
      .single()
    if (cours?.contenu) initialCourseText = cours.contenu
  }
  const initialAction = action === 'exercices' || action === 'controle' ? action : undefined

  return (
    <div className="min-h-screen">
      <Navbar prenom={prenom} profileType={profileType} pays={pays} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <UploadClient
          niveau={niveau}
          pays={pays}
          initialCourseText={initialCourseText}
          initialCoursId={coursId}
          initialAction={initialAction}
        />
      </main>
    </div>
  )
}
