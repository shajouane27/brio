'use client'

import Markdown from './Markdown'

export interface CorrectionElement {
  attendu?: string
  reponse?: string
  correct: boolean
  points?: number
  explication?: string
  // rétro-compatibilité ancien format
  texte?: string
  correction?: string
}

export interface CorrectionQuestion {
  numero: string
  type?: string
  enonce_court: string
  reponse_eleve: string
  points_obtenus: string | number
  points_max: string | number
  correct: boolean
  elements?: CorrectionElement[]
  pourquoi?: string
  exemple?: string
  // rétro-compatibilité ancien format
  bon_element?: string
  a_ameliorer?: string
  commentaire_peda?: string
}

export interface CorrectionResult {
  note_finale: string
  appreciation: string
  questions: CorrectionQuestion[]
}

const num = (v: string | number | undefined): number => parseFloat(String(v ?? 0)) || 0
const fmt = (v: string | number | undefined): string => {
  const n = num(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}

export default function CorrectionResultView({ result, saved }: { result: CorrectionResult; saved?: boolean }) {
  const totalObtained = result.questions.reduce((s, q) => s + num(q.points_obtenus), 0)
  const totalMax = result.questions.reduce((s, q) => s + num(q.points_max), 0)
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
            const status = q.correct ? 'ok' : num(q.points_obtenus) === 0 ? 'ko' : 'partial'
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
                  <span className="text-sm font-bold shrink-0 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">{fmt(q.points_obtenus)}/{fmt(q.points_max)}</span>
                </div>

                {q.reponse_eleve && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2 ml-8">
                    <span className="text-xs text-slate-400 font-medium">Ta réponse : </span>
                    <span className="text-sm text-slate-700"><Markdown content={q.reponse_eleve} inline /></span>
                  </div>
                )}

                {/* Détail élément par élément (réponses multiples) */}
                {q.elements && q.elements.length > 0 && (
                  <div className="ml-8 space-y-1.5">
                    {q.elements.map((el, j) => {
                      const rep = el.reponse ?? el.texte ?? ''
                      const att = el.attendu ?? el.correction ?? ''
                      return (
                        <div key={j} className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm rounded-lg px-3 py-1.5 ${el.correct ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                          <span className={el.correct ? 'text-emerald-600' : 'text-rose-500'}>{el.correct ? '✓' : '✗'}</span>
                          <span className={el.correct ? 'text-emerald-800' : 'text-rose-700 line-through'}>{rep || '—'}</span>
                          {!el.correct && att && <span className="text-emerald-700 font-semibold">→ {att}</span>}
                          {!el.correct && el.explication && <span className="w-full text-xs text-slate-500 pl-5">{el.explication}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Explication globale + exemple */}
                {(q.pourquoi || q.commentaire_peda) && (
                  <div className="flex gap-2 items-start ml-8 bg-brand-50 rounded-lg px-3 py-2">
                    <span className="text-brand-500 text-sm mt-0.5 shrink-0">💡</span>
                    <span className="text-xs text-brand-800 leading-relaxed"><Markdown content={q.pourquoi || q.commentaire_peda || ''} inline /></span>
                  </div>
                )}
                {q.exemple && (
                  <div className="flex gap-2 items-start ml-8 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-400 text-sm mt-0.5 shrink-0">📝</span>
                    <span className="text-xs text-slate-600 leading-relaxed"><span className="font-semibold">Exemple : </span><Markdown content={q.exemple} inline /></span>
                  </div>
                )}
                {!q.pourquoi && q.a_ameliorer && (
                  <div className="flex gap-2 items-start ml-8 bg-accent-50 rounded-lg px-3 py-2">
                    <span className="text-accent-500 text-sm mt-0.5 shrink-0">→</span>
                    <span className="text-xs text-accent-800 leading-relaxed"><Markdown content={q.a_ameliorer} inline /></span>
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
