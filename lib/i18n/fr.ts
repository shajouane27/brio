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

  // ── Page upload — textes interface ──────────────────────────────────────────
  page_upload_titre:      'Analyser un cours',
  page_upload_sous_titre: 'Prends en photo toutes les pages de ton cours et laisse Brio faire le reste.',
  step_photos:            'Photos',
  step_contenu_extrait:   'Contenu extrait',
  step_genere:            'Généré',
  traitement_photo:       'Traitement en cours…',
  depose_photos:          'Dépose tes photos ici !',
  choisis_photos:         'Choisis tes photos de cours',
  ajouter_pages:          "Ajouter d'autres pages",
  depuis_galerie:         'depuis ta galerie, ou glisse-dépose ici',
  prendre_photo_btn:      'Prendre une photo maintenant',
  extraction_en_cours:    'Extraction en cours…',
  claude_analyse:         'Claude analyse tes pages et reconstitue le cours…',
  contenu_extrait_titre:  'Contenu extrait',
  que_generer:            'Que veux-tu générer à partir de ce cours ?',
  pour_sentrainer:        "pour s'entraîner",
  en_conditions_examen:   "en conditions d'examen",
  essentiel_5min:         "l'essentiel en 5 min",
  mode_dictee_desc:       "l'app lit, tu écris",
  maximum_atteint:        'Maximum atteint',
  glisse_reordonner:      'glisse pour réordonner',
  generation_label:       'Génération…',
  nouveau_cours:          'Nouveau cours',
  fichier_pas_image:      "Ce fichier n'est pas une image. Formats acceptés : JPG, PNG, WEBP, HEIC.",
  requete_trop_longue:    "La requête a pris trop de temps. Vérifie ta connexion et réessaie.",
  niveau_label:           'Niveau',

  // ── ResultPanel ──────────────────────────────────────────────────────────────
  controle_genere:        'Contrôle type généré',
  fiche_revision_titre:   'Fiche de révision',
  exercices_generes:      'Exercices générés',
  copier:                 'Copier',
  copie_ok:               '✓ Copié !',
  telecharger_fiche_pdf:  'Télécharger la fiche en PDF',
  erreur_pdf:             'Impossible de générer le PDF. Réessaie.',
  retour_btn:             '← Retour',

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

  // ── Page cours ───────────────────────────────────────────────────────────────
  mes_cours_titre:    'Mes cours',
  sous_titre_cours:   'Tes cours analysés sont sauvegardés ici — réutilise-les sans reprendre de photo.',

  // ── Dashboard stats ───────────────────────────────────────────────────────────
  controles_corriges_1:  'contrôle corrigé',
  controles_corriges_n:  'contrôles corrigés',
  moyenne_sur_20:         'moyenne /20',
  pas_encore_note:        'pas encore de note',

  // ── Flash backfill ───────────────────────────────────────────────────────────
  genere_questions_flash: 'Génère tes questions flash',
  flash_backfill_desc:    'Tu as déjà des cours analysés — crée leurs questions de révision en un clic.',
  flash_generation_btn:   'Générer mes questions',
  flash_en_cours:         'Génération…',
  flash_traitement:       'Encore {n} cours à traiter…',
  flash_termine:          'Terminé ! Tes questions sont prêtes 🎉',
  flash_erreur:           'Une erreur est survenue. Réessaie.',
  flash_chargement:       'Génération de tes questions… (quelques secondes)',

  // ── Commun ───────────────────────────────────────────────────────────────────
  retour:             '← Retour',
  terminer:           'Terminer',
  recommencer:        'Recommencer',
  niveau_scolaire:    'Mon niveau scolaire',
  enregistrer:        'Enregistrer',
}

export default fr
