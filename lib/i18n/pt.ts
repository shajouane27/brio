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

  // ── Comum ────────────────────────────────────────────────────────────────────
  retour:             '← Voltar',
  terminer:           'Terminar',
  recommencer:        'Recomeçar',
  niveau_scolaire:    'O meu nível escolar',
  enregistrer:        'Guardar',
}

export default pt
