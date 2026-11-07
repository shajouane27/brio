import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Pays ISO → langue Brio (utilisé pour request.geo.country sur Vercel)
const COUNTRY_TO_LANG: Record<string, 'fr' | 'pt'> = {
  PT: 'pt',
  // Pays francophones
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr',
  MA: 'fr', DZ: 'fr', TN: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', MG: 'fr',
  ML: 'fr', BF: 'fr', NE: 'fr', TD: 'fr', GN: 'fr', RW: 'fr', BJ: 'fr',
  TG: 'fr', CF: 'fr', CD: 'fr', CG: 'fr', GA: 'fr', DJ: 'fr', MR: 'fr',
}

/**
 * Détecte la langue pour un utilisateur non connecté.
 * Priorité :
 * 1. request.geo.country  (Vercel Edge — gratuit, instantané)
 * 2. Accept-Language header (fallback dev local / autres hébergeurs)
 * 3. 'fr' par défaut
 */
function detectLangFromGeoOrHeader(request: NextRequest): 'fr' | 'pt' {
  // 1. Géo Vercel
  const geoCountry = (request as NextRequest & { geo?: { country?: string } }).geo?.country?.toUpperCase()
  if (geoCountry && COUNTRY_TO_LANG[geoCountry]) {
    return COUNTRY_TO_LANG[geoCountry]
  }

  // 2. Accept-Language header
  const acceptLang = request.headers.get('accept-language') ?? ''
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

  return 'fr'
}

export async function updateSession(request: NextRequest) {
  const LANG_COOKIE = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const, httpOnly: false }

  // ── Détecte la langue AVANT de créer la réponse ──────────────────────────
  // On injecte x-brio-lang dans les headers de la REQUÊTE (pas seulement la réponse)
  // pour que i18n/request.ts puisse le lire dans ce même aller-retour.
  const modifiedHeaders = new Headers(request.headers)

  const existingLangCookie = request.cookies.get('brio_lang')?.value
  let detectedLang: 'fr' | 'pt' | null = null

  if (!existingLangCookie) {
    detectedLang = detectLangFromGeoOrHeader(request)
    modifiedHeaders.set('x-brio-lang', detectedLang)
  }

  const modifiedRequest = { headers: modifiedHeaders }

  let supabaseResponse = NextResponse.next({ request: modifiedRequest })

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
          // Conserver modifiedRequest pour ne pas perdre x-brio-lang
          supabaseResponse = NextResponse.next({ request: modifiedRequest })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Connecté : langue depuis le profil
    const pays: string = user.user_metadata?.pays ?? 'fr-FR'
    const lang: 'fr' | 'pt' = pays === 'pt-PT' ? 'pt' : 'fr'
    const current = request.cookies.get('brio_lang')?.value
    if (current !== lang) {
      supabaseResponse.cookies.set('brio_lang', lang, LANG_COOKIE)
      // Propager aussi dans les headers pour ce même rendu
      supabaseResponse.headers.set('x-brio-lang', lang)
    }
  } else if (detectedLang) {
    // Non connecté, première visite : pose le cookie de réponse
    supabaseResponse.cookies.set('brio_lang', detectedLang, LANG_COOKIE)
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
