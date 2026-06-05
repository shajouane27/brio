const USER_AGENT = 'BrioApp/1.0 (educational app; https://brio-zeta.vercel.app)'

export type VisualType = 'schema' | 'carte' | 'photo' | 'portrait' | 'other'

export interface WikimediaResult {
  imageUrl: string
  title: string
  description: string
  sourceUrl: string
  type: VisualType
}

// Timeout helper — renvoie null si la requête dépasse `ms` ms
function fetchWithTimeout(url: string, ms = 3000): Promise<Response> {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), ms)
  return fetch(url, {
    signal: controller.signal,
    headers: { 'User-Agent': USER_AGENT, accept: 'application/json' },
  }).finally(() => clearTimeout(tid))
}

// Déduit le type de visuel depuis le titre ou la catégorie Wikimedia
function guessType(title: string, hintType?: string): VisualType {
  if (hintType && ['schema', 'carte', 'photo', 'portrait'].includes(hintType)) {
    return hintType as VisualType
  }
  const t = title.toLowerCase()
  if (/(map|carte|mapa|world|europe|africa|asia|country|region)/.test(t)) return 'carte'
  if (/(portrait|person|personne|politician|scientist|biologie|président)/.test(t)) return 'portrait'
  if (/(diagram|schema|circuit|molecule|cell|cycle|process)/.test(t)) return 'schema'
  return 'photo'
}

// Cherche sur une édition Wikipédia donnée (ex: fr, pt, en)
async function searchOnWiki(page: string, lang: string): Promise<WikimediaResult | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`
    const res = await fetchWithTimeout(url, 3000)
    if (!res.ok) return null
    const j = await res.json()
    const img: string | undefined = j.thumbnail?.source
    if (!img) return null
    return {
      imageUrl: img,
      title: j.title ?? page,
      description: j.description ?? '',
      sourceUrl: j.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page)}`,
      type: guessType(j.title ?? page),
    }
  } catch {
    return null
  }
}

/**
 * Recherche une image Wikimedia pour un concept donné.
 *
 * Stratégie :
 * 1. Cherche sur `lang`.wikipedia.org (langue du cours)
 * 2. Si pas d'image, fallback sur en.wikipedia.org
 * 3. Si toujours rien, renvoie null (jamais de placeholder vide)
 *
 * @param concept       Titre de la page Wikipédia (anglais recommandé pour la précision)
 * @param lang          Code langue (fr, pt, en, es…) — défaut : en
 * @param hintType      Type visuel suggéré par Claude (schema|carte|photo|portrait)
 */
export async function searchWikimedia(
  concept: string,
  lang = 'en',
  hintType?: string
): Promise<WikimediaResult | null> {
  // Tentative 1 : langue du cours
  const primary = await searchOnWiki(concept, lang)
  if (primary) {
    return { ...primary, type: guessType(primary.title, hintType) }
  }

  // Tentative 2 : fallback anglais (seulement si la langue n'est pas déjà en)
  if (lang !== 'en') {
    const fallback = await searchOnWiki(concept, 'en')
    if (fallback) return { ...fallback, type: guessType(fallback.title, hintType) }
  }

  return null
}
