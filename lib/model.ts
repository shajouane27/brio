// Modèle Claude utilisé par toutes les routes IA (extraction, génération, correction).
// Centralisé ici : si le modèle change, une seule ligne à modifier.
//
// Surchargeable via la variable d'environnement ANTHROPIC_MODEL sur Vercel,
// sans redéploiement de code.
export const CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
