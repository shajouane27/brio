export type PaysId = 'fr-FR' | 'pt-PT'

export interface TraditionLitteraire {
  /** "Lisez attentivement", "Leia atentamente", "Read carefully"… */
  instruction_lecture: string
  /** Mots-clés dans la langue du cours qui déclenchent la génération d'un texte support */
  mots_cles_litterature: string
  /** Consignes pour le primaire */
  auteurs_primaire: string
  /** Consignes pour le collège */
  auteurs_college: string
  /** Consignes pour le lycée */
  auteurs_lycee: string
  /** Traditions poétiques spécifiques */
  tradition_poetique?: string
}

export interface CountryConfig {
  pays_id: PaysId
  nom: string
  langue_generation: string
  langue_interface: 'fr' | 'pt'
  format_pedagogique: string
  notation_defaut: string
  niveaux: string[]
  primaire: string[]
  college: string[]
  tradition_litteraire: TraditionLitteraire
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
  college: ['6ème', '5ème', '4ème', '3ème'],
  tradition_litteraire: {
    instruction_lecture: 'Lisez attentivement ce texte avant de répondre aux questions.',
    mots_cles_litterature: `
      compréhension de texte, lecture, texte littéraire, poésie, littérature,
      roman, nouvelle, théâtre, fable, conte, grammaire de texte, figures de style,
      expression écrite, rédaction, narration, description, argumentation, récit,
      analyse littéraire, commentaire, dissertation
    `,
    auteurs_primaire: `
      Texte court (5 à 8 lignes), vocabulaire simple, thème proche de la vie de l'enfant
      (animaux, famille, école, nature, amitié). Phrases courtes et claires.
      Inspiré de la littérature jeunesse française classique (La Fontaine simplifié,
      Perrault, comptines traditionnelles). En français courant adapté à l'âge.
    `,
    auteurs_college: `
      Texte de 10 à 20 lignes. Inspiré des auteurs du programme collège :
      Maupassant (nouvelles), Jules Verne (aventure), Victor Hugo (récits),
      Alphonse Daudet (Lettres de mon moulin), La Fontaine (fables),
      Molière (théâtre dialogué simple). Vocabulaire progressif, phrases variées.
    `,
    auteurs_lycee: `
      Texte littéraire de 20 à 40 lignes. Style authentique des auteurs du programme lycée
      et Baccalauréat : Maupassant, Flaubert, Zola, Balzac (roman réaliste) ;
      Victor Hugo, Baudelaire, Rimbaud, Verlaine (poésie) ;
      Molière, Racine, Corneille (théâtre) ; Montaigne, Voltaire (essai).
      Format identique aux sujets du Baccalauréat Français.
    `,
    tradition_poetique: `
      Poésie française : alexandrin (12 syllabes), sonnet (2 quatrains + 2 tercets),
      ode, ballade. Références : Ronsard, Du Bellay, Baudelaire (Fleurs du Mal),
      Verlaine (musicalité), Rimbaud (images fortes), Apollinaire (vers libre).
    `,
  },
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
  college: ['5º ano', '6º ano', '7º ano', '8º ano', '9º ano'],
  tradition_litteraire: {
    instruction_lecture: 'Leia atentamente este texto antes de responder às questões.',
    mots_cles_litterature: `
      compreensão de texto, leitura, texto literário, poesia, literatura,
      romance, conto, teatro, fábula, gramática de texto, figuras de estilo,
      expressão escrita, redação, narração, descrição, argumentação, narrativa,
      análise literária, comentário, dissertação, crónica
    `,
    auteurs_primaire: `
      Texto curto (5 a 8 linhas), vocabulário simples, tema próximo da vida da criança
      (animais, família, escola, natureza, amizade). Frases curtas e claras.
      Inspirado na literatura infantil portuguesa clássica e nos contos tradicionais
      portugueses. Em português europeu correto e adequado à faixa etária.
    `,
    auteurs_college: `
      Texto de 10 a 20 linhas. Inspirado nos autores do programa do ensino básico :
      José Saramago (prosa narrativa acessível), Sophia de Mello Breyner Andresen
      (poesia e contos), António Torrado (literatura juvenil), Aquilino Ribeiro,
      Alves Redol. Vocabulário progressivo, frases variadas. Em português europeu.
    `,
    auteurs_lycee: `
      Texto literário de 20 a 40 linhas. Estilo autêntico dos autores do programa do
      Exame Nacional português (12º ano) : Fernando Pessoa (ortónimo e hétéronimos —
      Alberto Caeiro, Ricardo Reis, Álvaro de Campos) ; Eça de Queirós (romance
      realista) ; Luís de Camões (épica e lírica — sonetos camoninianos) ;
      Cesário Verde ; Almeida Garrett ; José Saramago (prosa contemporânea).
      Formato idêntico aos temas do Exame Nacional de Português (IAVE).
    `,
    tradition_poetique: `
      Poesia portuguesa : soneto camoniano (dois quartetos + dois tercetos, rima ABBA ABBA CDC DCD),
      redondilha maior (7 sílabas), redondilha menor (5 sílabas), verso decassilábico.
      Tema da saudade (sentimento de nostalgia e melancolia profundamente português),
      amor platónico, mar e horizonte (associados aos Descobrimentos).
      Referências : Camões (Os Lusíadas, Rimas), Fernando Pessoa e seus hétéronimos,
      Sophia de Mello Breyner Andresen (claridade e Mar).
    `,
  },
}

export const COUNTRIES: CountryConfig[] = [FR_FR, PT_PT]

export function getCountryConfig(pays?: string | null): CountryConfig {
  return COUNTRIES.find((c) => c.pays_id === pays) ?? FR_FR
}

/** Détermine si un niveau est primaire pour un pays donné */
export function isPrimaire(niveau: string, config: CountryConfig): boolean {
  return config.primaire.some((n) => niveau.includes(n))
}

/** Détermine si un niveau est collège pour un pays donné */
export function isCollege(niveau: string, config: CountryConfig): boolean {
  return config.college.some((n) => niveau.includes(n))
}
