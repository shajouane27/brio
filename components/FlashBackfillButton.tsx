'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FlashBackfillButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  async function run() {
    setLoading(true)
    setStatus('Génération de tes questions… (quelques secondes)')
    try {
      let guard = 0
      // Relance tant qu'il reste des cours à traiter (4 par appel)
      while (guard++ < 12) {
        const res = await fetch('/api/flash/backfill')
        if (!res.ok) throw new Error('backfill')
        const data = await res.json()
        if (data.restants > 0) {
          setStatus(`Encore ${data.restants} cours à traiter…`)
          continue
        }
        break
      }
      setStatus('Terminé ! Tes questions sont prêtes 🎉')
      router.refresh()
    } catch {
      setStatus('Une erreur est survenue. Réessaie.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-dashed border-accent-200 bg-accent-50/40 p-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl mb-3 shadow-sm">⚡</div>
      <p className="font-bold text-slate-800">Génère tes questions flash</p>
      <p className="text-sm text-slate-500 mt-1">
        Tu as déjà des cours analysés — crée leurs questions de révision en un clic.
      </p>
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
            Génération…
          </>
        ) : (
          <>⚡ Générer mes questions</>
        )}
      </button>
      {status && <p className="text-xs text-slate-500 mt-3">{status}</p>}
    </div>
  )
}
