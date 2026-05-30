'use client'

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">{controle.matiere}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(controle.created_at)}{controle.duree && ` · ${controle.duree}`}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Note globale */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center border border-indigo-100">
            <div className="text-4xl font-bold text-indigo-700">{controle.correction.note_finale}</div>
            <div className="text-slate-600 text-sm mt-1">{controle.correction.appreciation}</div>
            {totalMax > 0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-500 mb-1">{totalObtained.toFixed(1)} / {totalMax} points</div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden border border-indigo-100">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, (totalObtained / totalMax) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          {controle.correction.questions.map((q, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 space-y-1.5 ${q.correct ? 'border-emerald-200 bg-emerald-50/30' : parseFloat(q.points_obtenus) === 0 ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${q.correct ? 'text-emerald-600' : parseFloat(q.points_obtenus) === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                    {q.correct ? '✓' : parseFloat(q.points_obtenus) === 0 ? '✗' : '~'}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">Q{q.numero}. {q.enonce_court}</span>
                </div>
                <span className={`text-sm font-bold shrink-0 ${q.correct ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {q.points_obtenus}/{q.points_max}
                </span>
              </div>

              {q.reponse_eleve && (
                <div className="bg-white/70 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-slate-400">Ta réponse : </span>
                  <span className="text-slate-700">{q.reponse_eleve}</span>
                </div>
              )}

              {q.bon_element && (
                <p className="text-xs text-emerald-700">✓ {q.bon_element}</p>
              )}
              {q.a_ameliorer && (
                <p className="text-xs text-amber-700">→ {q.a_ameliorer}</p>
              )}
              {q.commentaire_peda && (
                <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">{q.commentaire_peda}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
