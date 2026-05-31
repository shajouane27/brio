'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface Cours {
  id: string
  titre: string | null
  matiere: string
  niveau: string | null
  created_at: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Couleur de pastille par matière (palette de marque)
function matiereColor(matiere: string): string {
  const palette = [
    'bg-brand-100 text-brand-700',
    'bg-emerald-100 text-emerald-700',
    'bg-accent-100 text-accent-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-violet-100 text-violet-700',
  ]
  let hash = 0
  for (let i = 0; i < matiere.length; i++) hash = matiere.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export default function CoursList({ cours }: { cours: Cours[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Supprimer ce cours de ta bibliothèque ?')) return
    setDeletingId(id)
    const { error } = await supabase.from('cours').delete().eq('id', id)
    setDeletingId(null)
    if (!error) router.refresh()
    else alert('Impossible de supprimer ce cours. Réessaie.')
  }

  if (!cours.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-3">📚</div>
        <p className="text-slate-600 text-sm font-medium">Aucun cours sauvegardé pour l&apos;instant.</p>
        <p className="text-slate-400 text-xs mt-1">Analyse un cours et il apparaîtra automatiquement ici.</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 mt-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          ✨ Analyser un cours
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {cours.map((c) => (
        <Link
          key={c.id}
          href={`/upload?coursId=${c.id}`}
          className="group block bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 p-4 transition-all"
        >
          <div className="flex items-center gap-4">
            {/* Pastille matière */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs text-center leading-tight px-1 ${matiereColor(c.matiere)}`}>
              {c.matiere.split(/[\s-]/)[0].slice(0, 6)}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                {c.titre || 'Cours sans titre'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>{c.matiere}</span>
                {c.niveau && <span>· {c.niveau}</span>}
                <span>· {formatDate(c.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1.5 rounded-lg group-hover:bg-brand-100 transition-colors">
                Réutiliser →
              </span>
              <button
                onClick={(e) => handleDelete(c.id, e)}
                disabled={deletingId === c.id}
                aria-label="Supprimer ce cours"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
              >
                {deletingId === c.id ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
