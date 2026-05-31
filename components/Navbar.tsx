'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  prenom?: string
  profileType?: string
}

export default function Navbar({ prenom, profileType }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isParent = profileType === 'parent'
  const initial = (prenom?.charAt(0) ?? '?').toUpperCase()

  // Ferme le menu au clic extérieur
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-slate-200/80 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-sm shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <span className="text-white text-lg font-extrabold tracking-tight">B</span>
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">Brio</span>
        </Link>

        {/* Navigation centrale (élève uniquement) */}
        {!isParent && (
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/dashboard" label="Accueil" />
            <NavLink href="/upload" label="Analyser un cours" />
          </div>
        )}

        {/* Avatar + menu déroulant */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-100 transition-colors"
            aria-label="Menu du profil"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${isParent ? 'bg-gradient-to-br from-accent-400 to-accent-600' : 'bg-gradient-to-br from-brand-400 to-brand-600'}`}>
              {initial}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[8rem] truncate">
              {prenom}
            </span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg shadow-slate-900/10 border border-slate-200 py-2 animate-fade-in-up">
              {/* En-tête du menu */}
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{prenom}</p>
                <p className="text-xs text-slate-400">{isParent ? 'Espace parent' : 'Compte élève'}</p>
              </div>

              {/* Liens */}
              <div className="py-1">
                <MenuItem href="/dashboard" icon="🏠" label="Accueil" onClick={() => setMenuOpen(false)} />
                {!isParent && (
                  <MenuItem href="/parametres" icon="⚙️" label="Paramètres" onClick={() => setMenuOpen(false)} />
                )}
              </div>

              {/* Déconnexion */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="text-base">↪</span>
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
    >
      {label}
    </Link>
  )
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  )
}
