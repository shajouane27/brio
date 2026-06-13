'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LanguageContext } from '@/contexts/LanguageContext'
import { langFromPays } from '@/lib/i18n'
import { detectCountry, type DetectionMethod } from '@/lib/detectLanguage'

const STORAGE_KEY = 'brio_pays'

/** Écrit le cookie brio_lang (lu par next-intl côté serveur) */
function setLangCookie(lang: string) {
  if (typeof document === 'undefined') return
  document.cookie = `brio_lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

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
      const cachedMethod = sessionStorage.getItem(`${STORAGE_KEY}_method`) as DetectionMethod | null
      if (cachedMethod && cachedMethod !== 'default') {
        setDetectedPays(cached)
        setDetectionMethod(cachedMethod)
        setIsAutoDetected(true)
      }
      return
    }
    detectCountry().then(({ pays: detected, method }) => {
      setPaysState(detected)
      setDetectedPays(detected)
      setDetectionMethod(method)
      setIsAutoDetected(method !== 'default')
      sessionStorage.setItem(STORAGE_KEY, detected)
      sessionStorage.setItem(`${STORAGE_KEY}_method`, method)
      setLangCookie(langFromPays(detected))
    })
  }, [])

  /** Appelé par Navbar avec le pays du profil authentifié. */
  const syncPays = useCallback((newPays: string) => {
    if (newPays !== pays) {
      setPaysState(newPays)
      setIsAutoDetected(false)
      sessionStorage.setItem(STORAGE_KEY, newPays)
      sessionStorage.setItem(`${STORAGE_KEY}_method`, 'default')
      setLangCookie(langFromPays(newPays))
    }
  }, [pays])

  /** Appelé par PaysEditor / inscription quand l'utilisateur choisit manuellement. */
  const setPays = useCallback((newPays: string) => {
    setPaysState(newPays)
    setIsAutoDetected(false)
    sessionStorage.setItem(STORAGE_KEY, newPays)
    sessionStorage.setItem(`${STORAGE_KEY}_method`, 'default')
    setLangCookie(langFromPays(newPays))
  }, [])

  const value = useMemo(() => ({
    pays, isAutoDetected, detectedPays, detectionMethod,
    syncPays, setPays,
  }), [pays, isAutoDetected, detectedPays, detectionMethod, syncPays, setPays])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
