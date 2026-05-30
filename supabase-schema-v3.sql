-- ════════════════════════════════════════════════════════════════════════════
-- Brio – Schema v3
-- Permet aux parents de modifier le niveau scolaire de leurs enfants
-- ════════════════════════════════════════════════════════════════════════════

-- Remplace la politique UPDATE (v1 : élève uniquement)
-- par une version étendue qui inclut les parents liés
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_update"              on public.profiles;

create policy "profiles_update"
  on public.profiles for update
  using (
    -- L'élève modifie son propre profil
    auth.uid() = id
    or
    -- Un parent modifie le profil d'un enfant lié
    exists (
      select 1 from public.parent_child_links
      where parent_id = auth.uid() and child_id = id
    )
  )
  with check (
    auth.uid() = id
    or exists (
      select 1 from public.parent_child_links
      where parent_id = auth.uid() and child_id = id
    )
  );
