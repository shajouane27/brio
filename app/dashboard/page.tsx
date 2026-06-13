import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import HistoriqueList from '@/components/dashboard/HistoriqueList'
import ProgressionChart from '@/components/dashboard/ProgressionChart'
import ParentDashboard from '@/components/dashboard/ParentDashboard'
import FlashQuestions, { type FlashCard } from '@/components/FlashQuestions'
import FlashBackfillButton from '@/components/FlashBackfillButton'
import { getTranslations } from 'next-intl/server'
import { displayNiveau } from '@/lib/niveaux'
import { langFromPays } from '@/lib/i18n'

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
  const pays = profile?.pays ?? 'fr-FR'
  const lang = langFromPays(pays)
  const t = await getTranslations('Dashboard')
  const tNav = await getTranslations('Nav')

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
        <Navbar prenom={prenom} profileType={profileType} pays={pays} />
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

  // ── Questions flash du jour (les 5 moins récemment vues) ───────────────────
  const { data: flashRows } = await supabase
    .from('flash_cards')
    .select('id, type, question, options, reponse')
    .eq('user_id', user.id)
    .order('derniere_vue', { ascending: true, nullsFirst: true })
    .order('niveau_maitrise', { ascending: true })
    .limit(5)
  const flashCards = (flashRows ?? []) as FlashCard[]
  const flashStreak: number = profile?.flash_streak ?? 0

  // A-t-il des cours analysés ? (pour distinguer "aucun cours" de "cours sans questions")
  const { count: coursCount } = await supabase
    .from('cours')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // ── Stats rapides ──────────────────────────────────────────────────────────
  const notes = allControles
    .map((c) => c.note_sur_20)
    .filter((n): n is number => typeof n === 'number')
  const moyenne = notes.length
    ? (notes.reduce((s, n) => s + n, 0) / notes.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen">
      <Navbar prenom={prenom} profileType={profileType} pays={pays} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* ── Hero : accueil + CTA principal ──────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-600 to-indigo-500 p-7 sm:p-9 text-white shadow-lg shadow-indigo-600/20 animate-fade-in-up">
          <div className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-accent-400/20 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('bonjour')} {prenom} 👋</h1>
              <p className="text-indigo-100 mt-2.5 max-w-md text-base sm:text-lg leading-relaxed">
                {t('sous_titre')}
              </p>
              {niveau && (
                <span className="inline-flex items-center gap-1.5 mt-3.5 bg-white/15 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  🎓 {displayNiveau(niveau, pays)}
                </span>
              )}
            </div>
            <Link
              href="/upload"
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('analyser_btn')}
            </Link>
          </div>
        </section>

        {/* ── Accès rapides / stats ───────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-4">
          {allControles.length > 0 ? (
            <>
              <StatCard
                icon="📋"
                value={String(allControles.length)}
                label={allControles.length > 1 ? t('controles_n') : t('controles_1')}
                tone="brand"
              />
              <StatCard
                icon="🎯"
                value={moyenne ? `${moyenne}` : '—'}
                label={moyenne ? t('moyenne') : t('pas_de_note')}
                tone="accent"
              />
            </>
          ) : (
            <>
              {/* Encouragement — aucun contrôle pour l'instant */}
              <Link
                href="/upload"
                className="group flex flex-col justify-between rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="text-2xl">🚀</div>
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 font-bold text-brand-700">
                    {t('lancer_controle')}&nbsp;!
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <div className="text-xs font-medium text-brand-400 mt-1">
                    {t('premiere_note')}
                  </div>
                </div>
              </Link>

              {/* Encouragement — progression à venir */}
              <div className="flex flex-col justify-between rounded-2xl border border-accent-100 bg-gradient-to-br from-accent-50 to-white p-5">
                <div className="text-2xl">📈</div>
                <div className="mt-2">
                  <div className="font-bold text-accent-600">{t('ta_progression')}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    {t('progression_desc')}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Questions du jour ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span>⚡</span> {t('questions_du_jour')}
            </h2>
            {flashStreak > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-700 bg-accent-50 border border-accent-100 px-3 py-1 rounded-full">
                🔥 {flashStreak} jour{flashStreak > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {flashCards.length > 0 ? (
            <FlashQuestions cards={flashCards} initialStreak={flashStreak} />
          ) : (coursCount ?? 0) > 0 ? (
            <FlashBackfillButton />
          ) : (
            <div className="rounded-3xl border border-dashed border-accent-200 bg-accent-50/40 p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl mb-3 shadow-sm">⚡</div>
              <p className="font-bold text-slate-800">{t('analyser_premier')}</p>
              <p className="text-sm text-slate-500 mt-1">
                {t('flash_info')}
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 mt-4 bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                ✨ {t('analyser_btn')}
              </Link>
            </div>
          )}
        </section>

        {/* ── Progression ─────────────────────────────────────────────────── */}
        <ProgressionChart controles={allControles} />

        {/* ── Historique ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
            <span>📋</span> {t('mes_controles')}
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
