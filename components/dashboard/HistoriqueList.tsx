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
  if (note >= 14) return 'text-emerald-700 bg-emerald-100'
  if (note >= 10) return 'text-accent-700 bg-accent-100'
  return 'text-rose-700 bg-rose-100'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HistoriqueList({ controles, readOnly }: HistoriqueListProps) {
  const [selected, setSelected] = useState<Controle | null>(null)

  if (!controles.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-3">📋</div>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          {readOnly ? "Aucun contrôle corrigé pour l'instant." : "Aucun contrôle corrigé pour l'instant. Analyse un cours et corrige ta copie !"}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2.5">
        {controles.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="w-full bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 p-4 flex items-center gap-4 transition-all text-left group"
          >
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold ${noteColor(c.note_sur_20)}`}>
              <span className="text-xl leading-none">{c.note_obtenue?.split('/')[0] ?? '–'}</span>
              <span className="text-[10px] opacity-70 mt-0.5">{c.notation}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate">{c.matiere}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {formatDate(c.created_at)}
                {c.duree && ` · ${c.duree}`}
              </div>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-brand-600 group-hover:bg-brand-50 transition-all shrink-0">→</div>
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
