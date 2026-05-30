export const NIVEAUX = [
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  '6ème', '5ème', '4ème', '3ème',
  'Seconde', 'Première', 'Terminale',
] as const

export type Niveau = typeof NIVEAUX[number]
