'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface PdfDownloadButtonsProps {
  content: string
  meta: {
    niveau: string
    duree: string
    notation: string
  }
}

export default function PdfDownloadButtons({ content, meta }: PdfDownloadButtonsProps) {
  const t = useTranslations('Result')
  const tErrors = useTranslations('Errors')
  const [loadingPrint, setLoadingPrint] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setLoadingPrint(true)
    setError('')
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, fillable: false, meta }),
      })

      if (!res.ok) throw new Error('pdf')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'brio-controle.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(t('erreur_pdf'))
    } finally {
      setLoadingPrint(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={download}
        disabled={loadingPrint}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold disabled:opacity-50 transition-all"
      >
        {loadingPrint ? <Spinner /> : <span className="text-lg">🖨️</span>}
        {t('telecharger_pdf')}
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
