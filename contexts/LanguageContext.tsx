'use client'

import { createContext, useContext } from 'react'
import type { DetectionMethod } from '@/lib/detectLanguage'

/**
 * LanguageContext gère uniquement le pays/langue du profil utilisateur.
 * Les traductions passent maintenant par next-intl (useTranslations / getTranslations).
 */
export interface LanguageContextValue {
  pays: string
  /** Vrai si le pays a été détecté automatiquement (non choisi manuellement) */
  isAutoDetected: boolean
  detectedPays: string | null
  detectionMethod: DetectionMethod
  /** Appelé par Navbar quand il reçoit le pays authentifié du serveur */
  syncPays: (pays: string) => void
  /** Appelé manuellement par l'utilisateur (PaysEditor, inscription) */
  setPays: (pays: string) => void
}

const DEFAULT: LanguageContextValue = {
  pays: 'fr-FR',
  isAutoDetected: false,
  detectedPays: null,
  detectionMethod: 'default',
  syncPays: () => {},
  setPays: () => {},
}

export const LanguageContext = createContext<LanguageContextValue>(DEFAULT)

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
