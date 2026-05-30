'use client'

import { useState } from 'react'

export default function LinkCodeGenerator() {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/link-code', { method: 'POST' })
      const data = await res.json()
      if (res.ok) setCode(data.code)
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">🔗 Lier mon compte à un parent</h3>
        <p className="text-sm text-slate-500 mt-1">
          Génère un code à usage unique valable 1 heure. Donne-le à ton parent pour qu'il accède à tes résultats.
        </p>
      </div>

      {!code ? (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {loading ? 'Génération…' : 'Générer un code de liaison'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
            <p className="text-xs text-indigo-500 mb-2 font-medium uppercase tracking-wider">Ton code</p>
            <p className="text-4xl font-bold text-indigo-700 tracking-[0.3em]">{code}</p>
            <p className="text-xs text-indigo-400 mt-2">Valable 1 heure · Usage unique</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex-1 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors text-sm"
            >
              {copied ? '✓ Copié !' : 'Copier le code'}
            </button>
            <button
              onClick={() => { setCode(null) }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 transition-colors text-sm"
            >
              Nouveau code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
