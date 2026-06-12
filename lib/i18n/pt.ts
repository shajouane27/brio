/**
 * Traduções portuguesas do Brio (português europeu).
 * Para adicionar uma nova chave : adicionar aqui e em todos os outros ficheiros de língua.
 * Para adicionar uma nova língua : criar um ficheiro semelhante (ex: es.ts) e importá-lo em index.ts.
 */
const pt: Record<string, string> = {
  // ── Navegação ───────────────────────────────────────────────────────────────
  accueil:            'Início',
  mes_cours:          'As minhas aulas',
  analyser_cours:     'Analisar uma aula',
  tableau_de_bord:    'Painel de controlo',
  parametres:         'Definições',
  deconnexion:        'Terminar sessão',

  // ── Saudação ────────────────────────────────────────────────────────────────
  bonjour:            'Olá',

  // ── Upload / geração ─────────────────────────────────────────────────────────
  generer_controle:   'Gerar um teste',
  generer_exercices:  'Gerar exercícios',
  generer_fiche:      'Gerar uma ficha de revisão',
  extraire_cours:     'Extrair a aula',
  remplir_app:        'Preencher na app',
  corriger_copie:     'Corrigir a minha cópia',
  telecharger_pdf:    'Descarregar em PDF',
  prendre_photo:      'Tirar uma fotografia',
  nouveau_controle:   'Novo teste sobre esta aula',
  nouveaux_exercices: 'Novos exercícios sobre esta aula',

  // ── Página de upload — textos interface ──────────────────────────────────────
  page_upload_titre:      'Analisar uma aula',
  page_upload_sous_titre: 'Tira fotos de todas as páginas da tua aula e deixa o Brio fazer o resto.',
  step_photos:            'Fotografias',
  step_contenu_extrait:   'Conteúdo extraído',
  step_genere:            'Gerado',
  traitement_photo:       'A tratar…',
  depose_photos:          'Larga as fotos aqui!',
  choisis_photos:         'Escolhe as fotos da tua aula',
  ajouter_pages:          'Adicionar mais páginas',
  depuis_galerie:         'da tua galeria, ou arrasta para aqui',
  prendre_photo_btn:      'Tirar uma foto agora',
  extraction_en_cours:    'Extração em curso…',
  claude_analyse:         'O Claude está a analisar as tuas páginas e a reconstituir a aula…',
  contenu_extrait_titre:  'Conteúdo extraído',
  que_generer:            'O que queres gerar a partir desta aula?',
  pour_sentrainer:        'para treinar',
  en_conditions_examen:   'em condições de exame',
  essentiel_5min:         'o essencial em 5 min',
  mode_dictee_desc:       'a app lê, tu escreves',
  maximum_atteint:        'Máximo atingido',
  glisse_reordonner:      'arrasta para reordenar',
  generation_label:       'A gerar…',
  nouveau_cours:          'Nova aula',
  fichier_pas_image:      'Este ficheiro não é uma imagem. Formatos aceites: JPG, PNG, WEBP, HEIC.',
  requete_trop_longue:    'O pedido demorou demasiado. Verifica a tua ligação e tenta novamente.',
  niveau_label:           'Nível',

  // ── ResultPanel ───────────────────────────────────────────────────────────────
  controle_genere:        'Teste gerado',
  fiche_revision_titre:   'Ficha de revisão',
  exercices_generes:      'Exercícios gerados',
  copier:                 'Copiar',
  copie_ok:               '✓ Copiado!',
  telecharger_fiche_pdf:  'Descarregar a ficha em PDF',
  erreur_pdf:             'Impossível gerar o PDF. Tenta novamente.',
  retour_btn:             '← Voltar',

  // ── Correção ─────────────────────────────────────────────────────────────────
  progression:        'Progressão',
  correction:         'Correção',
  bonne_reponse:      'Resposta correta',
  pourquoi:           'Porquê ?',
  ma_reponse:         'A tua resposta',
  soumettre_copie:    'Entregar a minha cópia',
  question_suivante:  'Próxima pergunta',
  precedente:         'Anterior',

  // ── Painel ───────────────────────────────────────────────────────────────────
  mes_controles:      'Os meus testes corrigidos',
  questions_du_jour:  'Perguntas do dia',
  analyser_premier:   'Analisa a tua primeira aula para desbloquear as perguntas rápidas!',
  lancer_controle:    'Faz o teu primeiro teste!',
  ta_progression:     'A tua progressão',

  // ── Aulas ────────────────────────────────────────────────────────────────────
  aucun_cours:        'Nenhuma aula guardada por enquanto.',
  analyser_cours_btn: 'Analisar uma aula',
  reutiliser:         'Reutilizar →',

  // ── Ditado ───────────────────────────────────────────────────────────────────
  mode_dictee:        'Modo ditado',
  ecrire_sur_feuille: 'Escreve o que ouves na tua folha ✏️',

  // ── Página de aulas ──────────────────────────────────────────────────────────
  mes_cours_titre:    'As minhas aulas',
  sous_titre_cours:   'As tuas aulas analisadas ficam guardadas aqui — reutiliza-as sem voltar a tirar fotografias.',

  // ── Dashboard estatísticas ────────────────────────────────────────────────────
  controles_corriges_1:  'teste corrigido',
  controles_corriges_n:  'testes corrigidos',
  moyenne_sur_20:         'média /20',
  pas_encore_note:        'ainda sem nota',

  // ── Flash backfill ────────────────────────────────────────────────────────────
  genere_questions_flash: 'Gera as tuas perguntas rápidas',
  flash_backfill_desc:    'Já tens aulas analisadas — cria as suas perguntas de revisão com um clique.',
  flash_generation_btn:   'Gerar as minhas perguntas',
  flash_en_cours:         'A gerar…',
  flash_traitement:       'Ainda {n} aulas por tratar…',
  flash_termine:          'Concluído! As tuas perguntas estão prontas 🎉',
  flash_erreur:           'Ocorreu um erro. Tenta novamente.',
  flash_chargement:       'A gerar as tuas perguntas… (alguns segundos)',

  // ── Comum ────────────────────────────────────────────────────────────────────
  retour:             '← Voltar',
  terminer:           'Terminar',
  recommencer:        'Recomeçar',
  niveau_scolaire:    'O meu nível escolar',
  enregistrer:        'Guardar',
}

export default pt
