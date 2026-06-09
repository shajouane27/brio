'use client'

import { useState } from 'react'
import { getCountryConfig } from '@/lib/countries'

interface NiveauEditorProps {
  currentNiveau: string
  pays?: string
}

export default function NiveauEditor({ currentNiveau, pays = 'fr-FR' }: NiveauEditorProps) {
  // Niveaux disponibles selon le pays du profil
  const niveaux = getCountryConfig(pays).niveaux
  // Si le niveau actuel n'appartient pas à la liste du nouveau pays, on prend le premier
  const defaultNiveau = niveaux.includes(currentNiveau as typeof niveaux[number])
    ? currentNiveau
    : niveaux[0]

  const [selected, setSelected] = useState(defaultNiveau)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const isDirty = selected !== currentNiveau

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/update-niveau', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niveau: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h2 className="font-semibold text-slate-900">🎓 Mon niveau scolaire</h2>

      <div className="space-y-3">
        <label className="block text-sm text-slate-500">
          Niveau actuel
        </label>
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setSuccess(false) }}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 bg-white"
        >
          {niveaux.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {success && (
          <p className="text-sm text-emerald-600 flex items-center gap-1.5">
            <span>✓</span> Niveau mis à jour — pris en compte dès la prochaine génération.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
