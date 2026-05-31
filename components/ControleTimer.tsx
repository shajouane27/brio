'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ControleTimerProps {
  /** Durée choisie : '30min' | '1h' | '2h' | '3h' */
  duree: string
}

function dureeToMinutes(duree: string): number {
  switch (duree) {
    case '30min': return 30
    case '1h': return 60
    case '2h': return 120
    case '3h': return 180
    default: return 60
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(pattern) } catch { /* ignoré */ }
  }
}

export default function ControleTimer({ duree }: ControleTimerProps) {
  const totalSeconds = dureeToMinutes(duree) * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [running, setRunning] = useState(true)
  const vibratedAt5 = useRef(false)
  const vibratedAtEnd = useRef(false)

  // Décompte
  useEffect(() => {
    if (!running || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running, secondsLeft])

  // Vibration à 5 min de la fin (une seule fois)
  useEffect(() => {
    if (secondsLeft <= 300 && secondsLeft > 0 && !vibratedAt5.current) {
      vibratedAt5.current = true
      vibrate([200, 100, 200])
    }
    // Vibration douce, unique, à la fin
    if (secondsLeft === 0 && !vibratedAtEnd.current) {
      vibratedAtEnd.current = true
      vibrate(400)
    }
  }, [secondsLeft])

  const reset = useCallback(() => {
    setSecondsLeft(totalSeconds)
    setRunning(true)
    vibratedAt5.current = false
    vibratedAtEnd.current = false
  }, [totalSeconds])

  const finished = secondsLeft === 0
  const danger = !finished && secondsLeft <= 300
  const warn = !finished && !danger && secondsLeft <= totalSeconds / 2

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  // Couleurs selon l'état
  const theme = finished
    ? { card: 'bg-slate-100 border-slate-200', time: 'text-slate-500', label: 'text-slate-400', dot: 'bg-slate-400' }
    : danger
    ? { card: 'bg-rose-50 border-rose-200', time: 'text-rose-600', label: 'text-rose-500', dot: 'bg-rose-500' }
    : warn
    ? { card: 'bg-accent-50 border-accent-200', time: 'text-accent-600', label: 'text-accent-600', dot: 'bg-accent-500' }
    : { card: 'bg-emerald-50 border-emerald-200', time: 'text-emerald-600', label: 'text-emerald-600', dot: 'bg-emerald-500' }

  return (
    <div className="sticky top-16 z-30 mb-2">
      <div className={`rounded-2xl border shadow-md ${theme.card} px-4 py-3`}>
        <div className="flex items-center justify-between gap-3">
          {/* Temps */}
          <div className="flex items-center gap-3">
            <span className={`relative flex h-3 w-3 shrink-0`}>
              {danger && !finished && running && (
                <span className={`absolute inline-flex h-full w-full rounded-full ${theme.dot} opacity-60 animate-ping`} />
              )}
              <span className={`relative inline-flex h-3 w-3 rounded-full ${theme.dot}`} />
            </span>
            <div className="leading-none">
              <div className={`text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${theme.time}`}>
                {mm}:{ss}
              </div>
              <div className={`text-xs font-semibold mt-1 ${theme.label}`}>
                {finished ? 'Temps écoulé' : running ? 'Temps restant' : 'En pause'}
              </div>
            </div>
          </div>

          {/* Contrôles discrets */}
          <div className="flex items-center gap-1.5">
            {!finished && (
              <button
                onClick={() => setRunning((r) => !r)}
                aria-label={running ? 'Mettre en pause' : 'Reprendre'}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/70 transition-colors"
              >
                {running ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
            )}
            <button
              onClick={reset}
              aria-label="Réinitialiser le minuteur"
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Alerte douce quand le temps est écoulé */}
        {finished && (
          <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600 flex items-center gap-2 animate-fade-in-up">
            <span className="text-lg">⏳</span>
            <span>Le temps est écoulé. Tu peux relire ta copie tranquillement, puis la rendre.</span>
          </div>
        )}
      </div>
    </div>
  )
}
