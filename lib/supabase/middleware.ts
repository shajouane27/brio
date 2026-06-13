import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Synchronise le cookie brio_lang avec le pays du profil (lu depuis les métadonnées
  // utilisateur, sans requête DB supplémentaire). Utilisé par next-intl pour charger
  // la bonne langue côté serveur dès le premier rendu.
  if (user) {
    const pays: string = user.user_metadata?.pays ?? 'fr-FR'
    const lang = pays === 'pt-PT' ? 'pt' : 'fr'
    const current = request.cookies.get('brio_lang')?.value
    if (current !== lang) {
      supabaseResponse.cookies.set('brio_lang', lang, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 an
        sameSite: 'lax',
        httpOnly: false, // lisible côté client pour LanguageProvider
      })
    }
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtected = ['/dashboard', '/upload', '/parametres', '/exercices', '/controle', '/cours'].some(
    (p) => request.nextUrl.pathname.startsWith(p)
  )

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
