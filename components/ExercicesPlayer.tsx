'use client'

import { useState } from 'react'
import RegenButtons, { type RegenFn } from './RegenButtons'

export interface Exercice {
  type: 'qcm' | 'vraifaux' | 'ouverte'
  question: string
  options: string[]
  reponse: string
  explication: string
  exemple: string
  astuce: string
}

interface Props {
  exercices: Exercice[]
  onRegenerate?: RegenFn
}

export default function ExercicesPlayer({ exercices, onRegenerate }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [corrected, setCorrected] = useState(false)

  const gradable = exercices.filter((e) => e.type !== 'ouverte')
  const score = gradable.filter((e) => {
    const idx = exercices.indexOf(e)
    return answers[idx]?.trim() === e.reponse.trim()
  }).length

  function setAnswer(i: number, val: string) {
    if (corrected) return
    setAnswers((a) => ({ ...a, [i]: val }))
  }

  function reset() {
    setAnswers({})
    setCorrected(false)
  }

  return (
    <div className="space-y-4">
      {corrected && gradable.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 text-center shadow-sm">
          <div className="text-2xl font-extrabold">{score} / {gradable.length}</div>
          <div className="text-xs text-white/80 mt-0.5">bonnes réponses aux questions auto-corrigées</div>
        </div>
      )}

      {exercices.map((ex, i) => {
        const userAns = answers[i] ?? ''
        const isGradable = ex.type !== 'ouverte'
        const isCorrect = isGradable && userAns.trim() === ex.reponse.trim()

        return (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">{i + 1}</span>
              <h3 className="font-semibold text-slate-900 leading-snug">{ex.question}</h3>
            </div>

            {/* Choix (QCM / Vrai-Faux) */}
            {isGradable ? (
              <div className="space-y-2 ml-10">
                {ex.options.map((opt) => {
                  const selected = userAns === opt
                  const isAnswer = opt === ex.reponse
                  let cls = 'border-slate-200 bg-white hover:border-brand-300 text-slate-700'
                  if (corrected) {
                    if (isAnswer) cls = 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    else if (selected) cls = 'border-rose-200 bg-rose-50 text-rose-700'
                    else cls = 'border-slate-200 bg-white text-slate-400 opacity-70'
                  } else if (selected) {
                    cls = 'border-brand-400 bg-brand-50 text-brand-700'
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswer(i, opt)}
                      disabled={corrected}
                      className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl border-2 font-medium transition-all ${cls}`}
                    >
                      <span>{opt}</span>
                      {corrected && isAnswer && <span className="text-emerald-500">✓</span>}
                      {corrected && selected && !isAnswer && <span className="text-rose-400">✗</span>}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Question ouverte */
              <div className="ml-10">
                <textarea
                  value={userAns}
                  onChange={(e) => setAnswer(i, e.target.value)}
                  disabled={corrected}
                  rows={3}
                  placeholder="Écris ta réponse ici…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm text-slate-800 disabled:bg-slate-50"
                />
              </div>
            )}

            {/* Correction */}
            {corrected && (
              <div className="ml-10 mt-3 space-y-2 animate-fade-in-up">
                {isGradable && (
                  <p className={`text-sm font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isCorrect ? '✓ Bonne réponse !' : '✗ Réponse incorrecte'}
                  </p>
                )}

                {(!isCorrect || !isGradable) && (
                  <>
                    <div className="bg-emerald-50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-emerald-600 font-semibold">Bonne réponse : </span>
                      <span className="text-emerald-800">{ex.reponse}</span>
                    </div>
                    {ex.explication && (
                      <div className="bg-brand-50 rounded-lg px-3 py-2 text-sm text-brand-800">
                        <span className="font-semibold">Pourquoi ? </span>{ex.explication}
                      </div>
                    )}
                    {ex.exemple && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
                        <span className="font-semibold">Exemple : </span>{ex.exemple}
                      </div>
                    )}
                    {ex.astuce && (
                      <div className="bg-accent-50 rounded-lg px-3 py-2 text-sm text-accent-800">
                        <span className="font-semibold">💡 Astuce : </span>{ex.astuce}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {!corrected ? (
        <button
          onClick={() => setCorrected(true)}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-md shadow-brand-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          ✓ Corriger mes réponses
        </button>
      ) : (
        <>
          <button
            onClick={reset}
            className="w-full border border-slate-200 text-slate-600 font-semibold py-3 rounded-2xl hover:bg-slate-50 transition-colors text-sm"
          >
            ↺ Refaire les exercices
          </button>
          {onRegenerate && (
            <RegenButtons
              onRegenerate={onRegenerate}
              harder={gradable.length > 0 && score / gradable.length > 0.7}
            />
          )}
        </>
      )}
    </div>
  )
}
