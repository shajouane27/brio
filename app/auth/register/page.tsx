'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { COUNTRY_OPTIONS, getCountryConfig } from '@/lib/countries'
import CountrySelector from '@/components/CountrySelector'

type ProfileType = 'eleve' | 'parent'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [prenom, setPrenom] = useState('')
  const [pays, setPays] = useState('fr-FR')
  const [niveau, setNiveau] = useState(getCountryConfig('fr-FR').niveaux[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          prenom,
          profile_type: profileType,
          niveau: profileType === 'eleve' ? niveau : null,
          pays,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
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
          <p className="text-slate-500 mt-1">Prépare tes examens avec l&apos;IA</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Créer un compte</h2>
              <p className="text-slate-500 text-sm mb-6">Tu es…</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleProfileChoice('eleve')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-4xl">🎒</span>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-700">Élève</div>
                    <div className="text-xs text-slate-500 mt-0.5">CP → Terminale</div>
                  </div>
                </button>

                <button
                  onClick={() => handleProfileChoice('parent')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-4xl">👨‍👩‍👧</span>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-700">Parent</div>
                    <div className="text-xs text-slate-500 mt-0.5">Suivre mon enfant</div>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Se connecter
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
                  {profileType === 'eleve' ? '🎒 Compte élève' : '👨‍👩‍👧 Compte parent'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pays */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pays</label>
                  <CountrySelector
                    countries={[...COUNTRY_OPTIONS]}
                    value={pays}
                    onChange={handlePaysChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                    placeholder="Ton prénom"
                  />
                </div>

                {profileType === 'eleve' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Niveau scolaire</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                    placeholder="ton@email.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                    placeholder="6 caractères minimum"
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
                  {loading ? 'Création…' : 'Créer mon compte'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
