export type DetectionMethod = 'browser' | 'timezone' | 'ip' | 'default'

export interface DetectionResult {
  pays: string
  method: DetectionMethod
}

// Mapping code BCP-47 → pays Brio
const LANG_TO_PAYS: Record<string, string> = {
  'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'fr-BE': 'fr-FR',
  'fr-CH': 'fr-FR', 'fr-LU': 'fr-FR', 'fr-CA': 'fr-FR',
  'pt': 'pt-PT', 'pt-PT': 'pt-PT',
}

// Mapping fuseau horaire → pays Brio
const TZ_TO_PAYS: Record<string, string> = {
  'Europe/Paris':     'fr-FR',
  'Europe/Brussels':  'fr-FR',
  'Europe/Luxembourg': 'fr-FR',
  'Europe/Zurich':    'fr-FR',
  'Europe/Lisbon':    'pt-PT',
  'Atlantic/Azores':  'pt-PT',
  'Atlantic/Madeira': 'pt-PT',
}

// Mapping code pays ISO 3166-1 α-2 → pays Brio
// France + pays francophones d'Afrique et d'Europe
const CC_TO_PAYS: Record<string, string> = {
  // Français
  FR: 'fr-FR', BE: 'fr-FR', CH: 'fr-FR', LU: 'fr-FR', MC: 'fr-FR',
  // Afrique francophone
  MA: 'fr-FR', DZ: 'fr-FR', TN: 'fr-FR', SN: 'fr-FR', CI: 'fr-FR',
  CM: 'fr-FR', MG: 'fr-FR', ML: 'fr-FR', BF: 'fr-FR', NE: 'fr-FR',
  TD: 'fr-FR', GN: 'fr-FR', RW: 'fr-FR', BJ: 'fr-FR', TG: 'fr-FR',
  CF: 'fr-FR', CD: 'fr-FR', CG: 'fr-FR', GA: 'fr-FR', GQ: 'fr-FR',
  DJ: 'fr-FR', KM: 'fr-FR', MR: 'fr-FR',
  // Portugais
  PT: 'pt-PT',
}

/**
 * Détecte le pays de l'utilisateur côté client.
 *
 * Ordre de priorité :
 * 1. navigator.language   (immédiat)
 * 2. Fuseau horaire       (immédiat)
 * 3. API géolocalisation IP (async, timeout 3 s)
 * 4. France par défaut
 */
export async function detectCountry(): Promise<DetectionResult> {
  // 1. navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const nav = navigator.language
    if (LANG_TO_PAYS[nav]) return { pays: LANG_TO_PAYS[nav], method: 'browser' }
    const base = nav.split('-')[0]
    if (LANG_TO_PAYS[base]) return { pays: LANG_TO_PAYS[base], method: 'browser' }
  }

  // 2. Fuseau horaire
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TZ_TO_PAYS[tz]) return { pays: TZ_TO_PAYS[tz], method: 'timezone' }
  } catch { /* ignore */ }

  // 3. Géolocalisation IP (ipapi.co gratuit, sans clé)
  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(tid)
    if (res.ok) {
      const data = await res.json() as { country_code?: string }
      if (data.country_code && CC_TO_PAYS[data.country_code]) {
        return { pays: CC_TO_PAYS[data.country_code], method: 'ip' }
      }
    }
  } catch { /* timeout ou erreur réseau */ }

  return { pays: 'fr-FR', method: 'default' }
}
