'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { COUNTRY_OPTIONS, getCountryConfig } from '@/lib/countries'
import CountrySelector from '@/components/CountrySelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTranslations } from 'next-intl'

type ProfileType = 'eleve' | 'parent'

/** Traduit les erreurs brutes Supabase / réseau en message lisible */
function translateSupabaseError(msg: string, tErrors: ReturnType<typeof useTranslations>): string {
  const m = msg.toLowerCase()
  if (
    m.includes('load failed') ||
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('fetch')
  ) {
    return tErrors('load_failed')
  }
  if (m.includes('user already registered') || m.includes('email already')) {
    return tErrors('unknown') // on ne veut pas confirmer qu'un email existe
  }
  if (m.includes('timeout') || m.includes('too long')) {
    return tErrors('server_timeout', { status: '' }).replace(' ()', '')
  }
  return msg || tErrors('unknown')
}

export default function RegisterPage() {
  const t = useTranslations('Auth')
  const tErrors = useTranslations('Errors')

  const [step, setStep] = useState<1 | 2>(1)
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [prenom, setPrenom] = useState('')
  const [pays, setPays] = useState('fr-FR')
  const [niveau, setNiveau] = useState(getCountryConfig('fr-FR').niveaux[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  // Pré-sélection depuis la détection automatique
  const { detectedPays, isAutoDetected } = useLanguage()
  useEffect(() => {
    if (detectedPays && isAutoDetected) {
      setPays(detectedPays)
      setNiveau(getCountryConfig(detectedPays).niveaux[0])
    }
  }, [detectedPays, isAutoDetected])

  const detectedCountry = COUNTRY_OPTIONS.find((c) => c.id === detectedPays)

  // Quand le pays change, réinitialise le niveau au 1er de ce pays
  function handlePaysChange(newPays: string) {
    setPays(newPays)
    setNiveau(getCountryConfig(newPays).niveaux[0])
  }

  const niveauxDuPays = getCountryConfig(pays).niveaux

  function handleProfileChoice(type: ProfileType) {
    setProfileType(type)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profileType) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirige vers /auth/callback pour que le code PKCE soit bien échangé
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            prenom,
            profile_type: profileType,
            niveau: profileType === 'eleve' ? niveau : null,
            pays,
          },
        },
      })

      if (signUpError) {
        setError(translateSupabaseError(signUpError.message, tErrors))
        setLoading(false)
        return
      }

      if (data.user) {
        // Si session présente → confirmation email désactivée, on connecte directement
        if (data.session) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            prenom,
            profile_type: profileType,
            niveau: profileType === 'eleve' ? niveau : null,
            email,
            pays,
          })
          router.push('/dashboard')
          router.refresh()
        } else {
          // Confirmation email requise → on affiche un écran d'attente
          setEmailSent(true)
          setLoading(false)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(translateSupabaseError(msg, tErrors))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Brio</h1>
          <p className="text-slate-500 mt-1">{t('sous_titre')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {emailSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">✉️</div>
              <h2 className="text-xl font-semibold text-slate-900">
                {pays === 'pt-PT' ? 'Verifica o teu email!' : 'Vérifie ta boite mail !'}
              </h2>
              <p className="text-slate-500 text-sm">
                {pays === 'pt-PT'
                  ? <>Enviámos um link de confirmação para <strong>{email}</strong>. Clica nele para ativar a tua conta.</>
                  : <>On t&apos;a envoyé un lien de confirmation à <strong>{email}</strong>. Clique dessus pour activer ton compte.</>
                }
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                {pays === 'pt-PT' ? '→ Ir para a ligação' : '→ Aller à la connexion'}
              </Link>
            </div>
          ) : step === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">{t('creer_compte')}</h2>
              <p className="text-slate-500 text-sm mb-6">{t('tu_es')}</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleProfileChoice('eleve')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-4xl">🎒</span>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-700">{t('eleve')}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('eleve_desc')}</div>
                  </div>
                </button>

                <button
                  onClick={() => handleProfileChoice('parent')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-4xl">👨‍👩‍👧</span>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-700">{t('parent')}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('parent_desc')}</div>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                {t('deja_compte')}{' '}
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  {t('se_connecter')}
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ←
                </button>
                <h2 className="text-xl font-semibold text-slate-900">
                  {profileType === 'eleve' ? t('compte_eleve_titre') : t('compte_parent_titre')}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pays */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('pays_label')}</label>
                  <CountrySelector
                    countries={[...COUNTRY_OPTIONS]}
                    value={pays}
                    onChange={handlePaysChange}
                  />
                  {isAutoDetected && detectedCountry && (
                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                      <span>{detectedCountry.flag}</span>
                      {t('detection_pays', { pays: detectedCountry.nom })}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('prenom_label')}</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                    placeholder={t('prenom_placeholder')}
                  />
                </div>

                {profileType === 'eleve' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('niveau_label')}</label>
                    <select
                      value={niveau}
                      onChange={(e) => setNiveau(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 bg-white"
                    >
                      {niveauxDuPays.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                    placeholder={t('email_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('mot_de_passe')}</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                    placeholder={t('mdp_placeholder')}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {loading ? t('creation_loading') : t('creer_btn')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
