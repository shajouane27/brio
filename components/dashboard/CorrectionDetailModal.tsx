'use client'

import Markdown from '../Markdown'

interface Question {
  numero: string
  enonce_court: string
  reponse_eleve: string
  points_obtenus: string
  points_max: string
  correct: boolean
  bon_element: string
  a_ameliorer: string
  commentaire_peda: string
}

interface Controle {
  id: string
  matiere: string
  note_obtenue: string
  note_sur_20: number
  notation: string
  duree: string
  created_at: string
  correction: {
    note_finale: string
    appreciation: string
    questions: Question[]
  }
}

interface Props {
  controle: Controle
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CorrectionDetailModal({ controle, onClose }: Props) {
  const totalObtained = controle.correction.questions.reduce((s, q) => s + parseFloat(q.points_obtenus || '0'), 0)
  const totalMax = controle.correction.questions.reduce((s, q) => s + parseFloat(q.points_max || '0'), 0)
  const ratio = totalMax > 0 ? totalObtained / totalMax : null
  const tone = ratio === null ? 'brand' : ratio >= 0.7 ? 'emerald' : ratio >= 0.4 ? 'accent' : 'red'
  const heroClasses = {
    brand: 'from-brand-500 to-brand-700',
    emerald: 'from-emerald-500 to-emerald-600',
    accent: 'from-accent-500 to-accent-600',
    red: 'from-rose-500 to-rose-600',
  }[tone]

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

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Note globale */}
          <div className={`relative overflow-hidden rounded-2xl p-5 text-center text-white bg-gradient-to-br ${heroClasses} shadow-md`}>
            <div className="text-5xl font-extrabold tracking-tight">{controle.correction.note_finale}</div>
            <div className="text-white/90 text-sm mt-2"><Markdown content={controle.correction.appreciation} inline /></div>
            {totalMax > 0 && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="text-xs font-medium text-white/80 mb-1">{totalObtained.toFixed(1)} / {totalMax} points</div>
                <div className="h-2 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${Math.min(100, (ratio ?? 0) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          {controle.correction.questions.map((q, i) => {
            const status = q.correct ? 'ok' : parseFloat(q.points_obtenus) === 0 ? 'ko' : 'partial'
            const badge = {
              ok: { bg: 'bg-emerald-500', icon: '✓', border: 'border-l-emerald-400' },
              ko: { bg: 'bg-rose-500', icon: '✗', border: 'border-l-rose-400' },
              partial: { bg: 'bg-accent-500', icon: '~', border: 'border-l-accent-400' },
            }[status]
            return (
              <div key={i} className={`rounded-2xl border border-slate-200 border-l-4 ${badge.border} p-4 space-y-2`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`shrink-0 w-6 h-6 rounded-full ${badge.bg} text-white text-xs font-bold flex items-center justify-center mt-0.5`}>
                      {badge.icon}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">Q{q.numero}. <Markdown content={q.enonce_court} inline /></span>
                  </div>
                  <span className="text-sm font-bold shrink-0 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {q.points_obtenus}/{q.points_max}
                  </span>
                </div>

                {q.reponse_eleve && (
                  <div className="bg-slate-50 rounded-lg px-3 py-1.5 text-xs ml-8">
                    <span className="text-slate-400">Réponse : </span>
                    <span className="text-slate-700"><Markdown content={q.reponse_eleve} inline /></span>
                  </div>
                )}

                {q.bon_element && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-1.5 ml-8">✓ <Markdown content={q.bon_element} inline /></p>
                )}
                {q.a_ameliorer && (
                  <p className="text-xs text-accent-800 bg-accent-50 rounded-lg px-3 py-1.5 ml-8">→ <Markdown content={q.a_ameliorer} inline /></p>
                )}
                {q.commentaire_peda && (
                  <p className="text-xs text-brand-800 italic bg-brand-50 rounded-lg px-3 py-1.5 ml-8">💡 <Markdown content={q.commentaire_peda} inline /></p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
