const MATIERE_RULES: [string, RegExp][] = [
  ['Mathématiques', /\b(math[ée]matiques?|algèbre|géométrie|équation|fonction|dérivée?|intégrale?|vecteur|probabilité|statistique|polynôme|trigonométrie|calcul)\b/i],
  ['Physique-Chimie', /\b(physique|chimie|molécule|atome|énergie|force|vitesse|électricité|oxydation|réaction|loi de|newton|circuit|tension|courant)\b/i],
  ['SVT', /\b(svt|biologie|cellule|organisme|espèce|évolution|génétique|adn|ecosystème|photosynthèse|respiration|biodiversité|chromosome)\b/i],
  ['Français', /\b(français|grammaire|conjugaison|littérature|rédaction|narrat|texte|poème|roman|auteur|figure de style|orthographe|syntaxe)\b/i],
  ['Histoire', /\b(histoire|guerre|révolution|siècle|empire|monarchie|republic|colonisation|résistance|déportation|traité|civilisation)\b/i],
  ['Géographie', /\b(géographie|territoire|relief|population|ville|mondialisation|développement durable|climat|région|continent|frontière)\b/i],
  ['Histoire-Géographie', /\b(histoire-géo|hg\b)/i],
  ['Anglais', /\b(english|vocabulary|grammar|tense|present|past|future|reading|writing|listening|speaking|british|american)\b/i],
  ['Espagnol', /\b(español|espagnol|vocabulario|gramática|conjugación|présent|prétérit|subjonctif espagnol)\b/i],
  ['Philosophie', /\b(philosophie|concept|auteur|raisonnement|conscience|liberté|morale|éthique|platon|kant|descartes|raison)\b/i],
  ['SES', /\b(économie|sociologie|marché|pib|chômage|inégalité|mondialisation économique|entreprise|consommation|production)\b/i],
  ['Informatique', /\b(informatique|algorithme|programme|code|variable|boucle|fonction python|javascript|html|css|réseau|données)\b/i],
]

export function detectMatiere(text: string): string {
  const scores: Record<string, number> = {}

  for (const [matiere, regex] of MATIERE_RULES) {
    const matches = text.match(new RegExp(regex.source, 'gi'))
    if (matches) scores[matiere] = matches.length
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  return sorted.length ? sorted[0][0] : 'Autre'
}

export function normalizeNote(noteObtenue: string, notation: string): { sur20: number; max20: number } {
  // Letters: A=20 B=16 C=12 D=8 E=4
  if (notation === 'lettres') {
    const map: Record<string, number> = { A: 20, B: 16, C: 12, D: 8, E: 4 }
    const letter = noteObtenue.toUpperCase().charAt(0)
    return { sur20: map[letter] ?? 10, max20: 20 }
  }

  // Parse "X/Y" or "X" from string
  const match = noteObtenue.match(/([\d.,]+)\s*\/?\s*([\d]+)?/)
  if (!match) return { sur20: 0, max20: 20 }
  const obtained = parseFloat(match[1].replace(',', '.'))
  const max = match[2] ? parseFloat(match[2]) : notation === '/100' ? 100 : 20

  if (max === 20) return { sur20: obtained, max20: 20 }
  if (max === 100) return { sur20: (obtained / 100) * 20, max20: 20 }
  return { sur20: (obtained / max) * 20, max20: 20 }
}
