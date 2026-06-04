type Lang = 'fr' | 'pt'

const T = {
  // ── Navigation ────────────────────────────────────────────────────────────
  accueil:            { fr: 'Accueil',              pt: 'Início' },
  mes_cours:          { fr: 'Mes cours',             pt: 'As minhas aulas' },
  analyser_cours:     { fr: 'Analyser un cours',     pt: 'Analisar uma aula' },
  tableau_de_bord:    { fr: 'Tableau de bord',       pt: 'Painel de controlo' },
  parametres:         { fr: 'Paramètres',            pt: 'Definições' },
  deconnexion:        { fr: 'Déconnexion',           pt: 'Terminar sessão' },

  // ── Salutation ────────────────────────────────────────────────────────────
  bonjour:            { fr: 'Bonjour',               pt: 'Olá' },

  // ── Upload / génération ───────────────────────────────────────────────────
  generer_controle:   { fr: 'Générer un contrôle type',     pt: 'Gerar um teste' },
  generer_exercices:  { fr: 'Générer des exercices',        pt: 'Gerar exercícios' },
  generer_fiche:      { fr: 'Générer une fiche de révision', pt: 'Gerar uma ficha de revisão' },
  extraire_cours:     { fr: 'Extraire le cours',            pt: 'Extrair a aula' },
  remplir_app:        { fr: 'Remplir dans l\'app',          pt: 'Preencher na app' },
  corriger_copie:     { fr: 'Corriger ma copie',            pt: 'Corrigir a minha cópia' },
  telecharger_pdf:    { fr: 'Télécharger en PDF',           pt: 'Descarregar em PDF' },
  prendre_photo:      { fr: 'Prendre une photo',            pt: 'Tirar uma fotografia' },
  nouveau_controle:   { fr: 'Nouveau contrôle sur ce cours', pt: 'Novo teste sobre esta aula' },
  nouveaux_exercices: { fr: 'Nouveaux exercices sur ce cours', pt: 'Novos exercícios sobre esta aula' },

  // ── Correction ────────────────────────────────────────────────────────────
  progression:        { fr: 'Progression',           pt: 'Progressão' },
  correction:         { fr: 'Correction',            pt: 'Correção' },
  bonne_reponse:      { fr: 'Bonne réponse',         pt: 'Resposta correta' },
  pourquoi:           { fr: 'Pourquoi ?',            pt: 'Porquê ?' },
  ma_reponse:         { fr: 'Ta réponse',            pt: 'A tua resposta' },
  soumettre_copie:    { fr: 'Soumettre ma copie',    pt: 'Entregar a minha cópia' },
  question_suivante:  { fr: 'Question suivante',     pt: 'Próxima pergunta' },
  precedente:         { fr: 'Précédent',             pt: 'Anterior' },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  mes_controles:      { fr: 'Mes contrôles corrigés', pt: 'Os meus testes corrigidos' },
  questions_du_jour:  { fr: 'Questions du jour',     pt: 'Perguntas do dia' },
  analyser_premier:   { fr: 'Analyse ton premier cours pour débloquer les questions flash !',
                        pt: 'Analisa a tua primeira aula para desbloquear as perguntas rápidas!' },
  lancer_controle:    { fr: 'Lance ton premier contrôle !', pt: 'Faz o teu primeiro teste!' },
  ta_progression:     { fr: 'Ta progression',        pt: 'A tua progressão' },

  // ── Cours ─────────────────────────────────────────────────────────────────
  aucun_cours:        { fr: 'Aucun cours sauvegardé pour l\'instant.',
                        pt: 'Nenhuma aula guardada por enquanto.' },
  analyser_cours_btn: { fr: 'Analyser un cours',     pt: 'Analisar uma aula' },
  reutiliser:         { fr: 'Réutiliser →',          pt: 'Reutilizar →' },

  // ── Dictée ────────────────────────────────────────────────────────────────
  mode_dictee:        { fr: 'Mode dictée',           pt: 'Modo ditado' },
  ecrire_sur_feuille: { fr: 'Écris ce que tu entends sur ta feuille ✏️',
                        pt: 'Escreve o que ouves na tua folha ✏️' },

  // ── Commun ────────────────────────────────────────────────────────────────
  retour:             { fr: '← Retour',              pt: '← Voltar' },
  terminer:           { fr: 'Terminer',              pt: 'Terminar' },
  recommencer:        { fr: 'Recommencer',           pt: 'Recomeçar' },
  niveau_scolaire:    { fr: 'Mon niveau scolaire',   pt: 'O meu nível escolar' },
  enregistrer:        { fr: 'Enregistrer',           pt: 'Guardar' },
} as const

export type TranslationKey = keyof typeof T

/** Traduit une clé dans la langue donnée. Fallback vers le français. */
export function t(key: TranslationKey, lang: Lang = 'fr'): string {
  const entry = T[key]
  if (!entry) return key
  return entry[lang] ?? entry['fr']
}

/** Retourne la langue à partir du `pays` du profil. */
export function langFromPays(pays?: string | null): Lang {
  return pays === 'pt-PT' ? 'pt' : 'fr'
}
