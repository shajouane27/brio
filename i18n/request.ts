import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

const LOCALES = ['fr', 'pt'] as const
type Locale = typeof LOCALES[number]

function isLocale(v: string | undefined): v is Locale {
  return LOCALES.includes(v as Locale)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Priorité 1 : cookie brio_lang (visites suivantes, utilisateur connecté)
  // Priorité 2 : header x-brio-lang posé par le middleware (première visite — détection geo/Accept-Language)
  // Priorité 3 : 'fr' par défaut
  const raw =
    cookieStore.get('brio_lang')?.value ??
    headerStore.get('x-brio-lang') ??
    undefined
  const locale: Locale = isLocale(raw) ? raw : 'fr'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
