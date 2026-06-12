export const NIVEAUX = [
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  '6ème', '5ème', '4ème', '3ème',
  'Seconde', 'Première', 'Terminale',
] as const

export type Niveau = typeof NIVEAUX[number]

/** Mapping niveau français → équivalent portugais */
const FR_TO_PT: Record<string, string> = {
  'CP':        '1º ano',
  'CE1':       '2º ano',
  'CE2':       '3º ano',
  'CM1':       '4º ano',
  'CM2':       '5º ano',
  '6ème':      '6º ano',
  '5ème':      '7º ano',
  '4ème':      '8º ano',
  '3ème':      '9º ano',
  'Seconde':   '10º ano',
  'Première':  '11º ano',
  'Terminale': '12º ano',
}

/**
 * Affiche le niveau dans la bonne langue.
 * Un élève PT qui a encore un niveau FR stocké en DB verra la valeur mappée.
 */
export function displayNiveau(niveau: string, pays: string): string {
  if (pays === 'pt-PT') return FR_TO_PT[niveau] ?? niveau
  return niveau
}
