'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LanguageContext } from '@/contexts/LanguageContext'
import { t as tStatic, langFromPays, type TranslationKey, type Lang } from '@/lib/i18n'
import { detectCountry, type DetectionMethod } from '@/lib/detectLanguage'

const STORAGE_KEY = 'brio_pays'

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [pays, setPaysState] = useState('fr-FR')
  const [detectedPays, setDetectedPays] = useState<string | null>(null)
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethod>('default')
  const [isAutoDetected, setIsAutoDetected] = useState(false)

  // Initialisation au montage (côté client uniquement)
  useEffect(() => {
    const cached = sessionStorage.getItem(STORAGE_KEY)
    if (cached) {
      setPaysState(cached)
      // Si le cached vient d'une détection auto précédente, on le marque
      const cachedMethod = sessionStorage.getItem(`${STORAGE_KEY}_method`) as DetectionMethod | null
      if (cachedMethod && cachedMethod !== 'default') {
        setDetectedPays(cached)
        setDetectionMethod(cachedMethod)
        setIsAutoDetected(true)
      }
      return
    }
    // Pas de cache → détecter
    detectCountry().then(({ pays: detected, method }) => {
      setPaysState(detected)
      setDetectedPays(detected)
      setDetectionMethod(method)
      setIsAutoDetected(method !== 'default')
      sessionStorage.setItem(STORAGE_KEY, detected)
      sessionStorage.setItem(`${STORAGE_KEY}_method`, method)
    })
  }, [])

  /**
   * Appelé par Navbar avec le pays du profil authentifié.
   * Synchronise silencieusement sans marquer comme "auto-détecté".
   */
  const syncPays = useCallback((newPays: string) => {
    if (newPays !== pays) {
      setPaysState(newPays)
      setIsAutoDetected(false)
      sessionStorage.setItem(STORAGE_KEY, newPays)
      sessionStorage.setItem(`${STORAGE_KEY}_method`, 'default')
    }
  }, [pays])

  /**
   * Appelé par PaysEditor / inscription quand l'utilisateur choisit manuellement.
   */
  const setPays = useCallback((newPays: string) => {
    setPaysState(newPays)
    setIsAutoDetected(false)
    sessionStorage.setItem(STORAGE_KEY, newPays)
    sessionStorage.setItem(`${STORAGE_KEY}_method`, 'default')
  }, [])

  const lang: Lang = langFromPays(pays)

  const tFn = useCallback((key: TranslationKey | string) =>
    tStatic(key as TranslationKey, lang),
  [lang])

  const value = useMemo(() => ({
    pays, lang, detectedPays, detectionMethod, isAutoDetected,
    t: tFn, syncPays, setPays,
  }), [pays, lang, detectedPays, detectionMethod, isAutoDetected, tFn, syncPays, setPays])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
