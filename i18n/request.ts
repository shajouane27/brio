import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const LOCALES = ['fr', 'pt'] as const
type Locale = typeof LOCALES[number]

function isLocale(v: string | undefined): v is Locale {
  return LOCALES.includes(v as Locale)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('brio_lang')?.value
  const locale: Locale = isLocale(raw) ? raw : 'fr'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
