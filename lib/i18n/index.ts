/**
 * Système i18n de Brio.
 *
 * AJOUTER UNE NOUVELLE LANGUE :
 * 1. Créer lib/i18n/es.ts (ou autre code) avec les traductions.
 * 2. L'importer ici et l'ajouter à `translations`.
 * 3. C'est tout — rien d'autre à changer dans le code.
 */

import fr from './fr'
import pt from './pt'

export type Lang = 'fr' | 'pt'
export type TranslationKey = keyof typeof fr

const translations: Record<Lang, Record<string, string>> = { fr, pt }

/** Traduit une clé dans la langue donnée. Fallback vers le français. */
export function t(key: string, lang: Lang = 'fr'): string {
  return translations[lang]?.[key] ?? translations['fr']?.[key] ?? key
}

/** Retourne la langue à partir du `pays` du profil. */
export function langFromPays(pays?: string | null): Lang {
  return pays === 'pt-PT' ? 'pt' : 'fr'
}

/** Retourne toutes les traductions pour une langue donnée. */
export function getTranslations(lang: Lang): Record<string, string> {
  return translations[lang] ?? translations['fr']
}
