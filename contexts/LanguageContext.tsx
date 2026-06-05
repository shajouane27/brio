'use client'

import { createContext, useContext } from 'react'
import { type Lang, type TranslationKey, t as tStatic, langFromPays } from '@/lib/i18n'
import type { DetectionMethod } from '@/lib/detectLanguage'

export interface LanguageContextValue {
  pays: string
  lang: Lang
  /** Pays détecté automatiquement (null si vient du profil ou sessionStorage) */
  detectedPays: string | null
  /** Méthode de détection utilisée */
  detectionMethod: DetectionMethod
  /** Vrai si le pays a été détecté automatiquement (non choisi manuellement) */
  isAutoDetected: boolean
  /** Traduit une clé dans la langue courante */
  t: (key: TranslationKey | string) => string
  /** Appelé par Navbar quand il reçoit le pays authentifié du serveur */
  syncPays: (pays: string) => void
  /** Appelé manuellement par l'utilisateur (PaysEditor, inscription) */
  setPays: (pays: string) => void
}

const DEFAULT: LanguageContextValue = {
  pays: 'fr-FR',
  lang: 'fr',
  detectedPays: null,
  detectionMethod: 'default',
  isAutoDetected: false,
  t: (key) => tStatic(key as TranslationKey, 'fr'),
  syncPays: () => {},
  setPays: () => {},
}

export const LanguageContext = createContext<LanguageContextValue>(DEFAULT)

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
