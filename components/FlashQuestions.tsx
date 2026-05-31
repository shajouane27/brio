'use client'

import { useState } from 'react'

export interface FlashCard {
  id: string
  type: 'qcm' | 'vraifaux'
  question: string
  options: string[]
  reponse: string
}

interface Props {
  cards: FlashCard[]
  initialStreak: number
}

// Petit son de succès agréable, sans fichier audio (Web Audio API).
function playSuccess() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const notes = [523.25, 659.25, 783.99] // do, mi, sol
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.1
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.2)
    })
    setTimeout(() => ctx.close(), 800)
  } catch { /* son non disponible : ignoré */ }
}

export default function FlashQuestions({ cards, initialStreak }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<{ id: string; correct: boolean }[]>([])
  const [finished, setFinished] = useState(false)
  const [streak, setStreak] = useState(initialStreak)

  const card = cards[index]
  const total = cards.length
  const revealed = selected !== null

  function choose(option: string) {
    if (revealed) return
    const correct = option === card.reponse
    setSelected(option)
    if (correct) { setScore((s) => s + 1); playSuccess() }
    setResults((r) => [...r, { id: card.id, correct }])
  }

  async function next() {
    if (index < total - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
      return
    }
    // Fin de session — on enregistre
    setFinished(true)
    try {
      const res = await fetch('/api/flash/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (res.ok) {
        const data = await res.json()
        if (typeof data.streak === 'number') setStreak(data.streak)
      }
    } catch { /* silencieux */ }
  }

  // ── Écran de fin ───────────────────────────────────────────────────────────
  if (finished) {
    const encouragement =
      score === total ? 'Parfait, sans-faute ! 🎉' :
      score >= Math.ceil(total * 0.6) ? 'Bien joué, continue comme ça !' :
      'Continue, tu progresses à chaque session !'
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm animate-fade-in-up">
        <div className="text-4xl mb-2">🏁</div>
        <div className="text-3xl font-extrabold text-slate-900">{score} / {total}</div>
        <p className="text-slate-500 mt-1">{encouragement}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-accent-50 text-accent-700 font-bold px-4 py-2 rounded-full">
          🔥 {streak} jour{streak > 1 ? 's' : ''} d&apos;affilée
        </div>
        <p className="text-xs text-slate-400 mt-4">Reviens demain pour de nouvelles questions et garder ta série !</p>
      </div>
    )
  }

  // ── Question en cours ────────────────────────────────────────────────────────
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Progression */}
      <div className="flex items-center gap-1.5 mb-5">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < index ? 'bg-accent-400' : i === index ? 'bg-accent-500' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400">Question {index + 1} / {total}</span>
        <span className="text-xs font-semibold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
          {card.type === 'vraifaux' ? 'Vrai / Faux' : 'QCM'}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 leading-snug mb-4">{card.question}</h3>

      <div className="space-y-2.5">
        {card.options.map((opt) => {
          const isCorrect = opt === card.reponse
          const isSelected = opt === selected
          let cls = 'border-slate-200 bg-white hover:border-accent-300 hover:bg-accent-50/40 text-slate-700'
          if (revealed) {
            if (isCorrect) cls = 'border-emerald-300 bg-emerald-50 text-emerald-800'
            else if (isSelected) cls = 'border-rose-200 bg-rose-50 text-rose-700'
            else cls = 'border-slate-200 bg-white text-slate-400 opacity-70'
          }
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={revealed}
              className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 rounded-2xl border-2 font-semibold transition-all ${cls}`}
            >
              <span>{opt}</span>
              {revealed && isCorrect && <span className="text-emerald-500">✓</span>}
              {revealed && isSelected && !isCorrect && <span className="text-rose-400">✗</span>}
            </button>
          )
        })}
      </div>

      {/* Feedback + suivant */}
      {revealed && (
        <div className="mt-5 animate-fade-in-up">
          {selected === card.reponse ? (
            <p className="text-sm font-semibold text-emerald-600 mb-3">✓ Bonne réponse !</p>
          ) : (
            <p className="text-sm font-semibold text-rose-500 mb-3">
              La bonne réponse était : <span className="text-slate-800">{card.reponse}</span>
            </p>
          )}
          <button
            onClick={next}
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
          >
            {index < total - 1 ? 'Question suivante →' : 'Voir mon score'}
          </button>
        </div>
      )}
    </div>
  )
}
