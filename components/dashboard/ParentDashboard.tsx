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
        <h2 className="font-semibold text-slate-900 mb-3">👨‍👩‍👧 Mes enfants</h2>
        {children.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="text-4xl mb-3">👶</div>
            <p className="text-slate-500 text-sm">Aucun enfant lié pour l'instant.</p>
            <p className="text-slate-400 text-xs mt-1">Saisissez le code généré par votre enfant ci-dessous.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/dashboard/enfant/${child.id}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm p-5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {child.prenom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {child.prenom}
                    </div>
                    <div className="text-xs text-slate-400">{child.niveau}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {child.controles_count} contrôle{child.controles_count !== 1 ? 's' : ''} corrigé{child.controles_count !== 1 ? 's' : ''}
                  </span>
                  {child.derniere_note && (
                    <span className="text-slate-600 font-medium">
                      Dernier : {child.derniere_note} · {child.derniere_matiere}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Link code form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-1">🔗 Ajouter un enfant</h3>
        <p className="text-sm text-slate-500 mb-4">
          Demandez à votre enfant de générer un code dans ses paramètres, puis saisissez-le ici.
        </p>
        <form onSubmit={handleLink} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-xl font-mono tracking-widest text-slate-900"
          />
          <button
            type="submit"
            disabled={code.length !== 6 || linking}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {linking ? '…' : 'Lier'}
          </button>
        </form>
        {linkError && <p className="text-red-600 text-sm mt-2">{linkError}</p>}
        {linkSuccess && <p className="text-emerald-600 text-sm mt-2">{linkSuccess}</p>}
      </div>
    </div>
  )
}
