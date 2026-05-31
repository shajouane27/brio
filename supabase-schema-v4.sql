-- ════════════════════════════════════════════════════════════════════════════
-- Brio – Schema v4 : bibliothèque de cours sauvegardés
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.cours (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  titre      text,
  matiere    text not null default 'Autre',
  niveau     text,
  contenu    text not null,
  created_at timestamptz default timezone('utc', now()) not null
);

alter table public.cours enable row level security;

-- L'élève ne voit / gère que ses propres cours
drop policy if exists "cours_select" on public.cours;
drop policy if exists "cours_insert" on public.cours;
drop policy if exists "cours_delete" on public.cours;

create policy "cours_select"
  on public.cours for select
  using (auth.uid() = user_id);

create policy "cours_insert"
  on public.cours for insert
  with check (auth.uid() = user_id);

create policy "cours_delete"
  on public.cours for delete
  using (auth.uid() = user_id);

-- Index pour le tri par date
create index if not exists cours_user_date_idx
  on public.cours (user_id, created_at desc);
