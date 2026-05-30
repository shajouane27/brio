'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  prenom?: string
  profileType?: string
}

export default function Navbar({ prenom, profileType }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-bold text-slate-900">Brio</span>
        </Link>

        <div className="flex items-center gap-3">
          {prenom && (
            <span className="text-sm text-slate-500 hidden sm:block">
              {profileType === 'parent' ? '👨‍👩‍👧' : '🎒'} {prenom}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}
