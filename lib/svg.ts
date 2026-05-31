// Nettoie un SVG généré par l'IA (retire scripts et gestionnaires d'événements).
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
}

/**
 * Extrait les blocs <svg>…</svg> du contenu généré.
 * Retourne le texte sans les SVG + la liste des SVG nettoyés.
 */
export function extractSvgs(content: string): { text: string; svgs: string[] } {
  const svgs: string[] = []
  let text = content.replace(/<svg[\s\S]*?<\/svg>/gi, (m) => { svgs.push(sanitizeSvg(m)); return '' })
  // Retire les éventuelles balises de code vides laissées autour du SVG
  text = text.replace(/```(?:svg|xml|html)?\s*```/gi, '').trim()
  return { text, svgs }
}
