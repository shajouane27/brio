'use client'

import { useState, useMemo } from 'react'
import CorrectionResultView, { type CorrectionResult } from './CorrectionResultView'
import RegenButtons, { type RegenFn } from './RegenButtons'

interface Props {
  controleContent: string
  notation: string
  niveau: string
  duree?: string
  onClose: () => void
  onSaved?: () => void
  onRegenerate?: RegenFn
}

interface QItem { numero: string; question: string; bareme: string; part: string }

// Découpe le sujet (Markdown) en questions remplissables.
function parseQuestions(md: string): QItem[] {
  const items: QItem[] = []
  let part = ''
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    const partM = line.match(/^#{2,3}\s+(.*)/)
    if (partM) { part = partM[1].replace(/\s*\([^)]*\)\s*$/, '').trim(); continue }
    const qM = line.match(/^(\d+)[.)]\s+(.+)$/)
    if (qM) {
      let text = qM[2].trim()
      if (/^[.…\s]+$/.test(text)) continue
      let bareme = ''
      const bm = text.match(/\(\s*(\d+\s*(?:pts?|points?))\s*\)\s*$/i)
      if (bm) { bareme = bm[1].replace(/\s+/g, ' '); text = text.slice(0, bm.index).trim() }
      items.push({ numero: qM[1], question: text, bareme, part })
    }
  }
  return items
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function ControleFiller({ controleContent, notation, niveau, duree, onClose, onSaved, onRegenerate }: Props) {
  const questions = useMemo(() => parseQuestions(controleContent), [controleContent])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [phase, setPhase] = useState<'fill' | 'correcting' | 'done'>('fill')
  const [result, setResult] = useState<CorrectionResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const total = questions.length

  async function submit() {
    setPhase('correcting')
    setError('')
    try {
      const payload = {
        controleContent,
        notation,
        niveau,
        answers: questions.map((q, i) => ({
          numero: q.numero,
          question: q.question,
          bareme: q.bareme,
          reponse: answers[i] ?? '',
        })),
      }
      const res = await fetch('/api/correct-copie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de correction')

      setResult(data.correction)
      setPhase('done')

      // Sauvegarde dans l'historique (table controles)
      fetch('/api/save-controle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controleContent, correction: data.correction, notation, duree }),
      }).then((r) => { if (r.ok) { setSaved(true); onSaved?.() } }).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setPhase('fill')
    }
  }

  // Aucun découpage possible
  if (total === 0) {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          Impossible de découper ce contrôle en questions automatiquement. Utilise plutôt la correction par photo.
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">
          ← Retour au contrôle
        </button>
      </div>
    )
  }

  // Résultats
  if (phase === 'done' && result) {
    const obtained = result.questions.reduce((s, q) => s + parseFloat(q.points_obtenus || '0'), 0)
    const max = result.questions.reduce((s, q) => s + parseFloat(q.points_max || '0'), 0)
    const harder = max > 0 && obtained / max > 0.7
    return (
      <div className="mt-6 space-y-4">
        <CorrectionResultView result={result} saved={saved} />
        <button onClick={onClose} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm">
          Retour au contrôle
        </button>
        {onRegenerate && <RegenButtons onRegenerate={onRegenerate} harder={harder} />}
      </div>
    )
  }

  const q = questions[index]
  const isLast = index === total - 1

  return (
    <div className="mt-6 space-y-5">
      {/* En-tête + progression */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg shrink-0">←</button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-slate-900">Remplir le contrôle</span>
            <span className="text-xs font-semibold text-slate-400">Question {index + 1} / {total}</span>
          </div>
          <div className="flex items-center gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < index ? 'bg-brand-400' : i === index ? 'bg-brand-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {q.part && <p className="text-xs font-semibold text-brand-500 mb-1.5">{q.part}</p>}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-slate-900 leading-snug">
            <span className="text-slate-400">{q.numero}.</span> {q.question}
          </h3>
          {q.bareme && (
            <span className="shrink-0 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">{q.bareme}</span>
          )}
        </div>
        <textarea
          value={answers[index] ?? ''}
          onChange={(e) => setAnswers((a) => ({ ...a, [index]: e.target.value }))}
          rows={5}
          placeholder="Écris ta réponse ici…"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm text-slate-800"
        />
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">{error}</div>}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || phase === 'correcting'}
          className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors text-sm"
        >
          ← Précédent
        </button>
        {isLast ? (
          <button
            onClick={submit}
            disabled={phase === 'correcting'}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold shadow-sm transition-all text-sm disabled:opacity-60"
          >
            {phase === 'correcting' ? <><Spinner /> Correction en cours…</> : '✓ Soumettre ma copie'}
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors text-sm"
          >
            Question suivante →
          </button>
        )}
      </div>

      {phase === 'correcting' && (
        <p className="text-center text-sm text-slate-500 animate-pulse">Claude corrige ta copie… 15–30 secondes.</p>
      )}
    </div>
  )
}
