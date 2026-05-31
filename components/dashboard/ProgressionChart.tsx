'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface Controle {
  id: string
  matiere: string
  note_sur_20: number
  created_at: string
}

interface ProgressionChartProps {
  controles: Controle[]
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
]

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function ProgressionChart({ controles }: ProgressionChartProps) {
  if (controles.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700">📈</span>
          Progression
        </h3>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="text-3xl mb-2 opacity-60">📊</div>
          <p className="text-sm text-slate-400 max-w-xs">
            {controles.length === 0
              ? 'Aucun résultat pour l\'instant. Corrige ta première copie pour suivre ta progression !'
              : 'Il te faut au moins 2 contrôles corrigés pour voir ta courbe de progression.'}
          </p>
        </div>
      </div>
    )
  }

  // Group by matière and build timeline points
  const matieres = [...new Set(controles.map((c) => c.matiere))]

  // Build unified date series (all unique dates sorted)
  const allDates = [...new Set(controles.map((c) => c.created_at))].sort()

  const chartData = allDates.map((date) => {
    const point: Record<string, string | number> = { date: formatDateShort(date) }
    for (const m of matieres) {
      const c = controles.find((c) => c.created_at === date && c.matiere === m)
      if (c) point[m] = Math.round(c.note_sur_20 * 10) / 10
    }
    return point
  })

  // Compute averages per matière
  const moyennes = matieres.map((m) => {
    const notes = controles.filter((c) => c.matiere === m).map((c) => c.note_sur_20)
    const avg = notes.reduce((a, b) => a + b, 0) / notes.length
    return { matiere: m, avg }
  })

  const enDifficulte = moyennes.filter((m) => m.avg < 10)
  const maitrisees = moyennes.filter((m) => m.avg >= 14)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700">📈</span>
          Progression par matière
        </h3>
        <div className="flex flex-wrap gap-2">
          {enDifficulte.map((m) => (
            <span key={m.matiere} className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full font-semibold border border-rose-100">
              ⚠ {m.matiere} ({m.avg.toFixed(1)}/20)
            </span>
          ))}
          {maitrisees.map((m) => (
            <span key={m.matiere} className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
              ✓ {m.matiere} ({m.avg.toFixed(1)}/20)
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value, name) => [`${value}/20`, name as string]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={10} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: 'Seuil 10', position: 'right', fontSize: 10, fill: '#ef4444' }} />

          {matieres.map((m, i) => (
            <Line
              key={m}
              type="monotone"
              dataKey={m}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: COLORS[i % COLORS.length] }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
