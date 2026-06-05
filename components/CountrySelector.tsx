'use client'

import { useState, useRef, useEffect } from 'react'

export interface CountryOption {
  id: string
  nom: string
  flag: string
  langue: string
}

interface CountrySelectorProps {
  countries: CountryOption[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export default function CountrySelector({ countries, value, onChange, disabled }: CountrySelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = countries.find((c) => c.id === value) ?? countries[0]

  const filtered = query.trim()
    ? countries.filter((c) =>
        c.nom.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase())
      )
    : countries

  // Fermer au clic extérieur
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Focus sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function select(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Déclencheur */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 text-slate-900">
          <span className="text-xl leading-none">{selected?.flag}</span>
          <span className="font-medium">{selected?.nom ?? '—'}</span>
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-900/10 overflow-hidden animate-fade-in-up">
          {/* Recherche */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un pays…"
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 leading-none"
                >✕</button>
              )}
            </div>
          </div>

          {/* Liste */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 text-center">Aucun résultat</li>
            ) : (
              filtered.map((c) => {
                const isSelected = c.id === value
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => select(c.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50 transition-colors ${isSelected ? 'bg-brand-50' : ''}`}
                    >
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>{c.nom}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-brand-600 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
