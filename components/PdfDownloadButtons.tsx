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
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Télécharger le contrôle</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => download(false)}
          disabled={loadingPrint || loadingFill}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loadingPrint ? (
            <Spinner />
          ) : (
            <span>🖨️</span>
          )}
          Version imprimable
        </button>

        <button
          onClick={() => download(true)}
          disabled={loadingPrint || loadingFill}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loadingFill ? (
            <Spinner />
          ) : (
            <span>💻</span>
          )}
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
