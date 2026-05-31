'use client'

import { useState } from 'react'

interface PdfDownloadButtonsProps {
  content: string
  meta: {
    niveau: string
    duree: string
    notation: string
  }
}

export default function PdfDownloadButtons({ content, meta }: PdfDownloadButtonsProps) {
  const [loadingPrint, setLoadingPrint] = useState(false)
  const [loadingFill, setLoadingFill] = useState(false)

  async function download(fillable: boolean) {
    const setter = fillable ? setLoadingFill : setLoadingPrint
    setter(true)

    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, fillable, meta }),
      })

      if (!res.ok) throw new Error('Erreur PDF')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fillable ? 'brio-controle-interactif.pdf' : 'brio-controle-imprimable.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Impossible de générer le PDF. Réessaie.')
    } finally {
      setter(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-100 text-brand-700">⬇️</span>
        Télécharger le contrôle
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => download(false)}
          disabled={loadingPrint || loadingFill}
          className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-semibold disabled:opacity-50 transition-all"
        >
          {loadingPrint ? <Spinner /> : <span>🖨️</span>}
          Version imprimable
        </button>

        <button
          onClick={() => download(true)}
          disabled={loadingPrint || loadingFill}
          className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 hover:border-brand-300 text-brand-700 text-sm font-semibold disabled:opacity-50 transition-all"
        >
          {loadingFill ? <Spinner /> : <span>💻</span>}
          Version interactive
        </button>
      </div>
      <p className="text-xs text-slate-400">
        La version interactive contient des champs à remplir sur ordinateur ou tablette.
      </p>
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
