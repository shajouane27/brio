'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Child {
  id: string
  prenom: string
  niveau: string
  controles_count: number
  derniere_note: string | null
  derniere_matiere: string | null
}

interface ParentDashboardProps {
  children: Child[]
}

export default function ParentDashboard({ children }: ParentDashboardProps) {
  const [code, setCode] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')

  async function handleLink(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setLinking(true)
    setLinkError('')
    setLinkSuccess('')

    try {
      const res = await fetch('/api/link-code', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLinkSuccess(`✓ ${data.child.prenom} (${data.child.niveau}) lié avec succès ! Rechargez la page.`)
      setCode('')
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Children list */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
          <span>👨‍👩‍👧</span> Mes enfants
        </h2>
        {children.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-3">👶</div>
            <p className="text-slate-600 text-sm font-medium">Aucun enfant lié pour l&apos;instant.</p>
            <p className="text-slate-400 text-xs mt-1">Saisissez le code généré par votre enfant ci-dessous.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/dashboard/enfant/${child.id}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 p-5 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {child.prenom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                      {child.prenom}
                    </div>
                    <div className="text-xs font-medium text-slate-400">🎓 {child.niveau}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                  <span className="text-slate-500">
                    {child.controles_count} contrôle{child.controles_count !== 1 ? 's' : ''}
                  </span>
                  {child.derniere_note && (
                    <span className="text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg text-xs">
                      {child.derniere_note} · {child.derniere_matiere}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Link code form */}
      <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl border border-brand-100 p-6">
        <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700">🔗</span>
          Ajouter un enfant
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Demandez à votre enfant de générer un code dans ses paramètres, puis saisissez-le ici.
        </p>
        <form onSubmit={handleLink} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-center text-xl font-mono tracking-[0.4em] text-slate-900"
          />
          <button
            type="submit"
            disabled={code.length !== 6 || linking}
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold transition-colors shadow-sm"
          >
            {linking ? '…' : 'Lier'}
          </button>
        </form>
        {linkError && <p className="text-rose-600 text-sm font-medium mt-2">{linkError}</p>}
        {linkSuccess && <p className="text-emerald-600 text-sm font-medium mt-2">{linkSuccess}</p>}
      </div>
    </div>
  )
}
