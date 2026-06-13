import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Codes pays francophones détectables via l'IP (même liste que detectLanguage.ts)
const FR_COUNTRY_CODES = new Set([
  'FR','BE','CH','LU','MC',
  'MA','DZ','TN','SN','CI','CM','MG','ML','BF','NE',
  'TD','GN','RW','BJ','TG','CF','CD','CG','GA','GQ','DJ','KM','MR',
])

/**
 * Dérive la langue depuis le header Accept-Language.
 * Exemples : "pt-PT,pt;q=0.9,fr;q=0.8" → "pt"
 *            "fr-FR,fr;q=0.9"            → "fr"
 *            "en-US,en;q=0.9"            → "fr" (défaut)
 */
function detectLangFromHeader(acceptLang: string): 'fr' | 'pt' {
  // Parse toutes les entrées (tag;q=weight) triées par préférence décroissante
  const entries = acceptLang
    .split(',')
    .map((e) => {
      const [tag, q] = e.trim().split(';q=')
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of entries) {
    if (tag.startsWith('pt')) return 'pt'
    if (tag.startsWith('fr')) return 'fr'
  }
  return 'fr' // défaut
}

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

  const LANG_COOKIE = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const, httpOnly: false }

  if (user) {
    // ── Utilisateur connecté : utilise le pays du profil (user_metadata, sans requête DB)
    const pays: string = user.user_metadata?.pays ?? 'fr-FR'
    const lang = pays === 'pt-PT' ? 'pt' : 'fr'
    const current = request.cookies.get('brio_lang')?.value
    if (current !== lang) {
      supabaseResponse.cookies.set('brio_lang', lang, LANG_COOKIE)
    }
  } else if (!request.cookies.get('brio_lang')) {
    // ── Utilisateur non connecté sans cookie : détecte depuis Accept-Language
    // (immédiat, zéro latence — la détection IP reste côté client via detectCountry())
    const lang = detectLangFromHeader(request.headers.get('accept-language') ?? '')
    supabaseResponse.cookies.set('brio_lang', lang, LANG_COOKIE)
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
