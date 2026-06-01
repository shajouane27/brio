'use client'

import Markdown from './Markdown'

export interface CorrectionElement {
  texte: string
  correct: boolean
  correction: string
}

export interface CorrectionQuestion {
  numero: string
  enonce_court: string
  reponse_eleve: string
  points_obtenus: string
  points_max: string
  correct: boolean
  elements?: CorrectionElement[]
  bon_element: string
  a_ameliorer: string
  commentaire_peda: string
}

export interface CorrectionResult {
  note_finale: string
  appreciation: string
  questions: CorrectionQuestion[]
}

export default function CorrectionResultView({ result, saved }: { result: CorrectionResult; saved?: boolean }) {
  const totalObtained = result.questions.reduce((s, q) => s + parseFloat(q.points_obtenus || '0'), 0)
  const totalMax = result.questions.reduce((s, q) => s + parseFloat(q.points_max || '0'), 0)
  const ratio = totalMax > 0 ? totalObtained / totalMax : null
  const tone = ratio === null ? 'brand' : ratio >= 0.7 ? 'emerald' : ratio >= 0.4 ? 'accent' : 'red'
  const heroClasses = {
    brand: 'from-brand-500 to-brand-700',
    emerald: 'from-emerald-500 to-emerald-600',
    accent: 'from-accent-500 to-accent-600',
    red: 'from-rose-500 to-rose-600',
  }[tone]

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Note globale */}
      <div className={`relative overflow-hidden rounded-3xl p-7 text-center text-white bg-gradient-to-br ${heroClasses} shadow-lg`}>
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          {saved && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 px-3 py-1 rounded-full mb-3">
              <span>✓</span> Sauvegardé dans tes résultats
            </div>
          )}
          <div className="text-6xl font-extrabold tracking-tight leading-none drop-shadow-sm">{result.note_finale}</div>
          <p className="text-white/90 text-sm mt-3 max-w-sm mx-auto"><Markdown content={result.appreciation} inline /></p>
          {totalMax > 0 && (
            <div className="mt-5 max-w-xs mx-auto">
              <div className="text-xs font-medium text-white/80 mb-1.5">{totalObtained.toFixed(1)} / {totalMax} points</div>
              <div className="h-2.5 bg-white/25 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (ratio ?? 0) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Détail par question */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 mb-3 px-1">Détail par question</h3>
        <div className="space-y-3">
          {result.questions.map((q, i) => {
            const status = q.correct ? 'ok' : q.points_obtenus === '0' ? 'ko' : 'partial'
            const badge = {
              ok: { bg: 'bg-emerald-500', icon: '✓', border: 'border-l-emerald-400' },
              ko: { bg: 'bg-rose-500', icon: '✗', border: 'border-l-rose-400' },
              partial: { bg: 'bg-accent-500', icon: '~', border: 'border-l-accent-400' },
            }[status]
            return (
              <div key={i} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${badge.border} p-4 space-y-2.5 shadow-sm`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`shrink-0 w-6 h-6 rounded-full ${badge.bg} text-white text-xs font-bold flex items-center justify-center mt-0.5`}>{badge.icon}</span>
                    <span className="text-sm font-semibold text-slate-800">Q{q.numero}. <Markdown content={q.enonce_court} inline /></span>
                  </div>
                  <span className="text-sm font-bold shrink-0 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">{q.points_obtenus}/{q.points_max}</span>
                </div>

                {q.reponse_eleve && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2 ml-8">
                    <span className="text-xs text-slate-400 font-medium">Ta réponse : </span>
                    <span className="text-sm text-slate-700"><Markdown content={q.reponse_eleve} inline /></span>
                  </div>
                )}

                {/* Détail élément par élément (réponses multiples) */}
                {q.elements && q.elements.length > 0 && (
                  <div className="ml-8 flex flex-wrap gap-1.5">
                    {q.elements.map((el, j) => (
                      el.correct ? (
                        <span key={j} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                          ✓ {el.texte}
                        </span>
                      ) : (
                        <span key={j} className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                          ✗ <span className="line-through">{el.texte}</span>
                          {el.correction && <span className="text-emerald-700 not-italic">→ {el.correction}</span>}
                        </span>
                      )
                    ))}
                  </div>
                )}
                {q.bon_element && (
                  <div className="flex gap-2 items-start ml-8 bg-emerald-50 rounded-lg px-3 py-2">
                    <span className="text-emerald-500 text-sm mt-0.5 shrink-0">✓</span>
                    <span className="text-xs text-emerald-800 leading-relaxed"><Markdown content={q.bon_element} inline /></span>
                  </div>
                )}
                {q.a_ameliorer && (
                  <div className="flex gap-2 items-start ml-8 bg-accent-50 rounded-lg px-3 py-2">
                    <span className="text-accent-500 text-sm mt-0.5 shrink-0">→</span>
                    <span className="text-xs text-accent-800 leading-relaxed"><Markdown content={q.a_ameliorer} inline /></span>
                  </div>
                )}
                {q.commentaire_peda && (
                  <div className="flex gap-2 items-start ml-8 bg-brand-50 rounded-lg px-3 py-2">
                    <span className="text-brand-500 text-sm mt-0.5 shrink-0">💡</span>
                    <span className="text-xs text-brand-800 italic leading-relaxed"><Markdown content={q.commentaire_peda} inline /></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
