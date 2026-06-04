-- ════════════════════════════════════════════════════════════════════════════
-- Brio – Schema v8 : support multi-pays
-- ════════════════════════════════════════════════════════════════════════════

-- Colonne pays sur les profils (fr-FR par défaut)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'fr-FR';
