'use client'

import { useState } from 'react'
import CorrectionDetailModal from './CorrectionDetailModal'

interface Controle {
  id: string
  matiere: string
  note_obtenue: string
  note_sur_20: number
  notation: string
  duree: string
  contenu_controle: string
  correction: {
    note_finale: string
    appreciation: string
    questions: {
      numero: string
      enonce_court: string
      reponse_eleve: string
      points_obtenus: string
      points_max: string
      correct: boolean
      bon_element: string
      a_ameliorer: string
      commentaire_peda: string
    }[]
  }
  created_at: string
}

interface HistoriqueListProps {
  controles: Controle[]
  readOnly?: boolean
}

function noteColor(note: number): string {
  if (note >= 14) return 'text-emerald-600 bg-emerald-50'
  if (note >= 10) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HistoriqueList({ controles, readOnly }: HistoriqueListProps) {
  const [selected, setSelected] = useState<Controle | null>(null)

  if (!controles.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-slate-500 text-sm">
          {readOnly ? "Aucun contrôle corrigé pour l'instant." : "Aucun contrôle corrigé pour l'instant. Analyse un cours et corrige ta copie !"}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {controles.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="w-full bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm p-4 flex items-center gap-4 transition-all text-left group"
          >
            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold text-sm ${noteColor(c.note_sur_20)}`}>
              <span className="text-lg leading-none">{c.note_obtenue?.split('/')[0] ?? '–'}</span>
              <span className="text-xs opacity-70">{c.notation}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">{c.matiere}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {formatDate(c.created_at)}
                {c.duree && ` · ${c.duree}`}
              </div>
            </div>

            <div className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0">→</div>
          </button>
        ))}
      </div>

      {selected && (
        <CorrectionDetailModal
          controle={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
