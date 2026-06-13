'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTranslations } from 'next-intl'

export default function FlashBackfillButton() {
  const router = useRouter()
  const t = useTranslations('Flash')
  useLanguage() // conserve pays
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  async function run() {
    setLoading(true)
    setStatus(t('chargement'))
    try {
      let guard = 0
      while (guard++ < 12) {
        const res = await fetch('/api/flash/backfill')
        if (!res.ok) throw new Error('backfill')
        const data = await res.json()
        if (data.restants > 0) {
          setStatus(t('traitement', { n: data.restants }))
          continue
        }
        break
      }
      setStatus(t('termine'))
      router.refresh()
    } catch {
      setStatus(t('erreur'))
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-dashed border-accent-200 bg-accent-50/40 p-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl mb-3 shadow-sm">⚡</div>
      <p className="font-bold text-slate-800">{t('genere_titre')}</p>
      <p className="text-sm text-slate-500 mt-1">{t('genere_desc')}</p>
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 mt-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('en_cours')}
          </>
        ) : (
          <>⚡ {t('genere_btn')}</>
        )}
      </button>
      {status && <p className="text-xs text-slate-500 mt-3">{status}</p>}
    </div>
  )
}
