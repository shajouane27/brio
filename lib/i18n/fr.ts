/**
 * Traductions françaises de Brio.
 * Pour ajouter une nouvelle clé : l'ajouter ici et dans tous les autres fichiers de langue.
 * Pour ajouter une nouvelle langue : créer un fichier similaire (ex: es.ts) et l'importer dans index.ts.
 */
const fr: Record<string, string> = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  accueil:            'Accueil',
  mes_cours:          'Mes cours',
  analyser_cours:     'Analyser un cours',
  tableau_de_bord:    'Tableau de bord',
  parametres:         'Paramètres',
  deconnexion:        'Déconnexion',

  // ── Salutation ──────────────────────────────────────────────────────────────
  bonjour:            'Bonjour',

  // ── Upload / génération ──────────────────────────────────────────────────────
  generer_controle:   'Générer un contrôle type',
  generer_exercices:  'Générer des exercices',
  generer_fiche:      'Générer une fiche de révision',
  extraire_cours:     'Extraire le cours',
  remplir_app:        "Remplir dans l'app",
  corriger_copie:     'Corriger ma copie',
  telecharger_pdf:    'Télécharger en PDF',
  prendre_photo:      'Prendre une photo',
  nouveau_controle:   'Nouveau contrôle sur ce cours',
  nouveaux_exercices: 'Nouveaux exercices sur ce cours',

  // ── Correction ──────────────────────────────────────────────────────────────
  progression:        'Progression',
  correction:         'Correction',
  bonne_reponse:      'Bonne réponse',
  pourquoi:           'Pourquoi ?',
  ma_reponse:         'Ta réponse',
  soumettre_copie:    'Soumettre ma copie',
  question_suivante:  'Question suivante',
  precedente:         'Précédent',

  // ── Dashboard ───────────────────────────────────────────────────────────────
  mes_controles:      'Mes contrôles corrigés',
  questions_du_jour:  'Questions du jour',
  analyser_premier:   'Analyse ton premier cours pour débloquer les questions flash !',
  lancer_controle:    'Lance ton premier contrôle !',
  ta_progression:     'Ta progression',

  // ── Cours ────────────────────────────────────────────────────────────────────
  aucun_cours:        "Aucun cours sauvegardé pour l'instant.",
  analyser_cours_btn: 'Analyser un cours',
  reutiliser:         'Réutiliser →',

  // ── Dictée ───────────────────────────────────────────────────────────────────
  mode_dictee:        'Mode dictée',
  ecrire_sur_feuille: 'Écris ce que tu entends sur ta feuille ✏️',

  // ── Commun ───────────────────────────────────────────────────────────────────
  retour:             '← Retour',
  terminer:           'Terminer',
  recommencer:        'Recommencer',
  niveau_scolaire:    'Mon niveau scolaire',
  enregistrer:        'Enregistrer',
}

export default fr
