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
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Hero parent */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-7 sm:p-9 text-white shadow-lg shadow-brand-600/20 animate-fade-in-up">
            <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-16 bottom-0 w-28 h-28 rounded-full bg-accent-400/20 blur-2xl" />
            <div className="relative">
              <h1 className="text-3xl font-extrabold tracking-tight">Bonjour {prenom} 👋</h1>
              <p className="text-brand-100 mt-1.5">Espace parent — suivez la progression de vos enfants</p>
            </div>
          </section>

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

  // ── Stats rapides ──────────────────────────────────────────────────────────
  const notes = allControles
    .map((c) => c.note_sur_20)
    .filter((n): n is number => typeof n === 'number')
  const moyenne = notes.length
    ? (notes.reduce((s, n) => s + n, 0) / notes.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen">
      <Navbar prenom={prenom} profileType={profileType} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* ── Hero : accueil + CTA principal ──────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-7 sm:p-9 text-white shadow-lg shadow-brand-600/20 animate-fade-in-up">
          <div className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-accent-400/25 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Bonjour {prenom} 👋</h1>
              <p className="text-brand-100 mt-2 max-w-md">
                Prends en photo ton cours et laisse Brio générer tes exercices et corriger tes copies.
              </p>
              {niveau && (
                <span className="inline-flex items-center gap-1.5 mt-3 bg-white/15 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  🎓 {niveau}
                </span>
              )}
            </div>
            <Link
              href="/upload"
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-white text-brand-700 hover:bg-accent-50 font-bold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <span className="text-xl">📸</span> Analyser un cours
            </Link>
          </div>
        </section>

        {/* ── Accès rapides / stats ───────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            icon="📋"
            value={String(allControles.length)}
            label={`contrôle${allControles.length > 1 ? 's' : ''} corrigé${allControles.length > 1 ? 's' : ''}`}
            tone="brand"
          />
          <StatCard
            icon="🎯"
            value={moyenne ? `${moyenne}` : '—'}
            label={moyenne ? 'moyenne /20' : 'pas encore de note'}
            tone="accent"
          />
          <Link
            href="/upload"
            className="group flex flex-col items-start justify-center gap-1 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-300 p-5 transition-all col-span-2 sm:col-span-1"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">✨</span>
            <span className="font-bold text-brand-700">Nouveau cours</span>
            <span className="text-xs text-brand-400">Générer des exercices</span>
          </Link>
        </section>

        {/* ── Progression ─────────────────────────────────────────────────── */}
        <ProgressionChart controles={allControles} />

        {/* ── Historique ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
            <span>📋</span> Mes contrôles corrigés
          </h2>
          <HistoriqueList controles={allControles} />
        </section>
      </main>
    </div>
  )
}

function StatCard({ icon, value, label, tone }: { icon: string; value: string; label: string; tone: 'brand' | 'accent' }) {
  const toneClasses = tone === 'brand'
    ? 'from-brand-50 to-white border-brand-100 text-brand-700'
    : 'from-accent-50 to-white border-accent-100 text-accent-600'
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${toneClasses}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-extrabold tracking-tight leading-none">{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-1.5">{label}</div>
    </div>
  )
}
