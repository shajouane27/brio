'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import CountrySelector from './CountrySelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTranslations } from 'next-intl'

interface PaysEditorProps {
  currentPays: string
}

export default function PaysEditor({ currentPays }: PaysEditorProps) {
  const router = useRouter()
  const { setPays } = useLanguage()
  const t = useTranslations('Settings')
  const tCommon = useTranslations('Common')
  const [selected, setSelected] = useState(currentPays)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const isDirty = selected !== currentPays

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/update-pays', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pays: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Met à jour le LanguageContext immédiatement — sans attendre router.refresh()
      setPays(selected)
      setSuccess(true)
      // Rafraîchit les Server Components (profil, Navbar) pour rester en sync avec le serveur
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h2 className="font-semibold text-slate-900">{t('pays_titre')}</h2>

      <div className="space-y-3">
        <label className="block text-sm text-slate-500">
          {t('pays_desc')}
        </label>

        <CountrySelector
          countries={[...COUNTRY_OPTIONS]}
          value={selected}
          onChange={(id) => { setSelected(id); setSuccess(false) }}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {success && (
          <p className="text-sm text-emerald-600 flex items-center gap-1.5">{t('pays_ok')}</p>
        )}

        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {saving ? tCommon('enregistrer') + '…' : tCommon('enregistrer')}
        </button>
      </div>
    </div>
  )
}
