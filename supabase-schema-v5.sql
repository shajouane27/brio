-- ════════════════════════════════════════════════════════════════════════════
-- Brio – Schema v5 : fiche de révision rattachée au cours
-- ════════════════════════════════════════════════════════════════════════════

-- Colonne pour stocker la fiche de révision générée
alter table public.cours add column if not exists fiche text;

-- Politique UPDATE (n'existait pas en v4) — l'élève peut mettre à jour ses cours
drop policy if exists "cours_update" on public.cours;

create policy "cours_update"
  on public.cours for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
