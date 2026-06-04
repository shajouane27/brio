'use client'

import CorrectionResultView, { type CorrectionResult } from '../CorrectionResultView'

interface Controle {
  id: string
  matiere: string
  duree: string
  created_at: string
  correction: CorrectionResult
}

interface Props {
  controle: Controle
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CorrectionDetailModal({ controle, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">{controle.matiere}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(controle.created_at)}{controle.duree && ` · ${controle.duree}`}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl leading-none">×</button>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto flex-1 p-6">
          <CorrectionResultView result={controle.correction} />
        </div>
      </div>
    </div>
  )
}
