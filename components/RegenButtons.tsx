'use client'

export type RegenFn = (type: 'exercices' | 'controle', opts?: { harder?: boolean }) => void

export default function RegenButtons({ onRegenerate, harder }: { onRegenerate: RegenFn; harder?: boolean }) {
  return (
    <div className="pt-3 border-t border-slate-100">
      <p className="text-sm font-semibold text-slate-500 mb-3 text-center">Continuer à réviser ce cours</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onRegenerate('controle', { harder })}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
        >
          🔄 Nouveau contrôle sur ce cours
        </button>
        <button
          onClick={() => onRegenerate('exercices', { harder })}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-sm transition-colors"
        >
          ✏️ Nouveaux exercices sur ce cours
        </button>
      </div>
      {harder && (
        <p className="text-xs text-center text-accent-600 font-medium mt-2">Bravo ! La difficulté augmente un peu 💪</p>
      )}
    </div>
  )
}
