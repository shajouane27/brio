export type PaysId = 'fr-FR' | 'pt-PT'

export interface CountryConfig {
  pays_id: PaysId
  nom: string
  langue_generation: string
  langue_interface: 'fr' | 'pt'
  format_pedagogique: string
  notation_defaut: string
  niveaux: string[]
  primaire: string[]  // niveaux pour lesquels on active la dictée / modes enfants
}

// ─── France ────────────────────────────────────────────────────────────────
export const FR_FR: CountryConfig = {
  pays_id: 'fr-FR',
  nom: 'France',
  langue_generation: 'français',
  langue_interface: 'fr',
  format_pedagogique: `
    Suit le format des contrôles des écoles publiques françaises.
    Programme de l'Éducation Nationale française.
    Niveaux : CP à Terminale.
    Notation par défaut : sur 20 points.
    Structure : parties numérotées en chiffres romains (I, II, III).
    Sous-questions numérotées (1., 2., 3.).
    Vocabulaire scolaire français standard.
    Références culturelles françaises.
  `,
  notation_defaut: '/20',
  niveaux: [
    'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème', '5ème', '4ème', '3ème',
    'Seconde', 'Première', 'Terminale',
  ],
  primaire: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
}

// ─── Portugal ──────────────────────────────────────────────────────────────
export const PT_PT: CountryConfig = {
  pays_id: 'pt-PT',
  nom: 'Portugal',
  langue_generation: 'português europeu',
  langue_interface: 'pt',
  format_pedagogique: `
    Segue o formato dos exames das escolas públicas portuguesas.
    Programa do Ministério da Educação português (DGE).
    Níveis: 1º ao 12º ano.
    Sistema de avaliação: 0 a 20 valores (ensino básico e secundário).
    Estrutura: grupos numerados (Grupo I, Grupo II, Grupo III).
    Subquestões numeradas (1., 1.1., 1.2.).
    Vocabulário escolar português europeu — não brasileiro.
    Exemplos culturais portugueses: Lisboa, Porto, Rio Tejo, história portuguesa.
    Gera SEMPRE o conteúdo em português europeu.
  `,
  notation_defaut: '/20',
  niveaux: [
    '1º ano', '2º ano', '3º ano', '4º ano',
    '5º ano', '6º ano', '7º ano', '8º ano', '9º ano',
    '10º ano', '11º ano', '12º ano',
  ],
  primaire: ['1º ano', '2º ano', '3º ano', '4º ano'],
}

export const COUNTRIES: CountryConfig[] = [FR_FR, PT_PT]

export function getCountryConfig(pays?: string | null): CountryConfig {
  return COUNTRIES.find((c) => c.pays_id === pays) ?? FR_FR
}
